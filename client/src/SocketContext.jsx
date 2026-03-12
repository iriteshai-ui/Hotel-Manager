import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [stompClient, setStompClient] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [tables, setTables] = useState([]);
    const [orders, setOrders] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    
    const clientRef = useRef(null);

    const fetchInitialData = async () => {
        try {
            const response = await fetch(`http://${window.location.hostname}:8081/api/initial_data`);
            const data = await response.json();
            if (data.menuItems) setMenuItems(data.menuItems);
            if (data.tables) setTables(data.tables);
            if (data.orders) setOrders(data.orders);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    useEffect(() => {
        // Fetch initial data via REST since STOMP is push-based
        fetchInitialData();

        const client = new Client({
            webSocketFactory: () => new SockJS(`http://${window.location.hostname}:8081/ws`),
            onConnect: () => {
                setIsConnected(true);
                console.log("Connected to STOMP server");

                // Subscribe to updates
                client.subscribe('/topic/table_updated', (message) => {
                    const updatedTable = JSON.parse(message.body);
                    setTables((prev) => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
                });

                client.subscribe('/topic/order_added', (message) => {
                    const newOrder = JSON.parse(message.body);
                    setOrders((prev) => [...prev, newOrder]);
                });

                client.subscribe('/topic/order_updated', (message) => {
                    const updatedOrder = JSON.parse(message.body);
                    setOrders((prev) => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
                });
            },
            onDisconnect: () => {
                setIsConnected(false);
                console.log("Disconnected from STOMP server");
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            }
        });

        client.activate();
        clientRef.current = client;
        setStompClient(client);

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, []);

    const placeOrder = (tableId, items) => {
        if (clientRef.current && clientRef.current.connected) {
            const tableNumber = parseInt(tableId.replace('t', ''), 10);
            clientRef.current.publish({
                destination: '/app/place_order',
                body: JSON.stringify({ tableNumber, items })
            });
        }
    };

    const updateOrderStatus = (orderId, status) => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish({
                destination: '/app/update_order_status',
                body: JSON.stringify({ orderId, status })
            });
        }
    };

    const value = {
        isConnected,
        menuItems,
        tables,
        orders,
        placeOrder,
        updateOrderStatus
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
