import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [tables, setTables] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    
    const clientRef = useRef(null);

    const getToken = () => localStorage.getItem('auth_token');

    const getHotelId = () => localStorage.getItem('auth_hotel_id');

    const matchesCurrentTenant = (entity) => {
        const curHotel = getHotelId();
        if (!curHotel) return true; // not restricted to a specific hotel
        if (!entity || !entity.hotelId) return true; // general entity
        return entity.hotelId === curHotel;
    };

    const fetchInitialData = async () => {
        try {
            const headers = { 'Content-Type': 'application/json' };
            const token = getToken();
            const hotelId = getHotelId();
            if (token) headers['X-Auth-Token'] = token;
            if (hotelId) headers['x-hotel-id'] = hotelId;
            const response = await fetch(`/api/initial_data`, { headers });
            const data = await response.json();
            if (data.menuItems) setMenuItems(data.menuItems);
            if (data.tables) setTables(data.tables);
            if (data.orders) setOrders(data.orders);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    useEffect(() => {
        fetchInitialData();

        const handleAuthChange = () => fetchInitialData();
        window.addEventListener('storage', handleAuthChange);
        window.addEventListener('auth_state_changed', handleAuthChange);

        const client = new Client({
            webSocketFactory: () => new SockJS(`${window.location.protocol}//${window.location.host}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            onConnect: () => {
                setIsConnected(true);

                client.subscribe('/topic/table_updated', (message) => {
                    const updatedTable = JSON.parse(message.body);
                    if (!matchesCurrentTenant(updatedTable)) return;
                    setTables((prev) => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
                });

                client.subscribe('/topic/table_added', (message) => {
                    const newTable = JSON.parse(message.body);
                    if (!matchesCurrentTenant(newTable)) return;
                    setTables((prev) => {
                        if (prev.find(t => t.id === newTable.id)) return prev;
                        return [...prev, newTable].sort((a, b) => a.number - b.number);
                    });
                });

                client.subscribe('/topic/table_deleted', (message) => {
                    const deleted = JSON.parse(message.body);
                    if (!matchesCurrentTenant(deleted)) return;
                    setTables((prev) => prev.filter(t => t.id !== deleted.id));
                });

                client.subscribe('/topic/order_added', (message) => {
                    const newOrder = JSON.parse(message.body);
                    if (!matchesCurrentTenant(newOrder)) return;
                    setOrders((prev) => [...prev, newOrder]);
                });

                client.subscribe('/topic/order_updated', (message) => {
                    const updatedOrder = JSON.parse(message.body);
                    if (!matchesCurrentTenant(updatedOrder)) return;
                    setOrders((prev) => {
                        if (updatedOrder.status === 'PAID') {
                            return prev.filter(o => o.id !== updatedOrder.id);
                        }
                        return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
                    });
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            window.removeEventListener('storage', handleAuthChange);
            window.removeEventListener('auth_state_changed', handleAuthChange);
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, []);

    const placeOrder = async (tableId, items, explicitHotelId = null) => {
        const tableNumber = parseInt(tableId.replace('t', ''), 10);
        const hotelId = explicitHotelId || getHotelId();
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination: '/app/place_order',
                body: JSON.stringify({ tableNumber, items, hotelId })
            });
        } else {
            try {
                const headers = { 'Content-Type': 'application/json' };
                const token = getToken();
                if (token) headers['X-Auth-Token'] = token;
                if (hotelId) headers['x-hotel-id'] = hotelId;

                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ tableNumber, items, hotelId })
                });
                if (res.ok) {
                    const newOrder = await res.json();
                    setOrders((prev) => [...prev, newOrder]);
                }
            } catch (err) {
                console.error("Failed to place order via HTTP fallback:", err);
            }
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination: '/app/update_order_status',
                body: JSON.stringify({ orderId, status })
            });
        } else {
            try {
                const token = getToken();
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['X-Auth-Token'] = token;
                const res = await fetch(`/api/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ status })
                });
                if (res.ok) {
                    const updatedOrder = await res.json();
                    setOrders((prev) => {
                        if (updatedOrder.status === 'PAID') {
                            return prev.filter(o => o.id !== updatedOrder.id);
                        }
                        return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
                    });
                }
            } catch (err) {
                console.error("Failed to update status via HTTP fallback:", err);
            }
        }
    };

    const freeTable = async (tableNumber) => {
        const token = getToken();
        const res = await fetch(`/api/tables/${tableNumber}/free`, {
            method: 'PUT',
            headers: { 'X-Auth-Token': token }
        });
        if (res.ok) {
            const updated = await res.json();
            setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
        }
        return res.ok;
    };

    const addTable = async (number, capacity = 4) => {
        const token = getToken();
        const res = await fetch('/api/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token },
            body: JSON.stringify({ number, capacity })
        });
        if (res.ok) {
            const newTable = await res.json();
            setTables(prev => {
                if (prev.find(t => t.id === newTable.id)) return prev;
                return [...prev, newTable].sort((a, b) => a.number - b.number);
            });
        }
        return res;
    };

    const deleteTable = async (number) => {
        const token = getToken();
        const res = await fetch(`/api/tables/${number}`, {
            method: 'DELETE',
            headers: { 'X-Auth-Token': token }
        });
        if (res.ok) {
            setTables(prev => prev.filter(t => t.number !== number));
        }
        return res.ok;
    };

    const value = {
        isConnected,
        menuItems,
        tables,
        orders,
        placeOrder,
        updateOrderStatus,
        freeTable,
        addTable,
        deleteTable,
        refreshData: fetchInitialData,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
