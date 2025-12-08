import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

export function Notifications() {
    const { user } = useAuth();
    const { notifications, fetchNotifications, markAsRead, markAllAsRead, clearAll } = useNotificationsStore();
    const unreadCount = notifications.filter((n) => !n.read).length;
    const lastSeenIdRef = useRef<string | null>(null);

    // Poll for notifications
    useEffect(() => {
        if (!user?.id) return;

        fetchNotifications(user.id); // Initial fetch

        const interval = setInterval(() => {
            fetchNotifications(user.id);
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [user?.id, fetchNotifications]);

    // Toast on new notification
    useEffect(() => {
        if (notifications.length === 0) return;
        const newest = notifications[0];

        if (lastSeenIdRef.current === null) {
            lastSeenIdRef.current = newest.id;
            return;
        }

        if (newest.id !== lastSeenIdRef.current) {
            if (!newest.read) {
                toast.info(newest.message);
            }
            lastSeenIdRef.current = newest.id;
        }
    }, [notifications]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-xl">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="accent"
                            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold shadow-lime-glow"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 z-[9999] rounded-2xl overflow-hidden" align="end">
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                    <h3 className="font-semibold font-display">Notifications</h3>
                    {notifications.length > 0 && (
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => user?.id && markAllAsRead(user.id)}
                                    className="h-7 text-xs hover:text-primary"
                                >
                                    Mark all read
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => user?.id && clearAll(user.id)}
                                className="h-7 text-xs hover:text-destructive"
                            >
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                <Bell className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-all duration-200 ${!notification.read ? 'bg-accent/5 border-l-2 border-l-accent' : ''
                                        }`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className="font-medium text-sm">{notification.title}</h4>
                                        {!notification.read && (
                                            <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0 mt-1 shadow-lime-glow" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">
                                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
