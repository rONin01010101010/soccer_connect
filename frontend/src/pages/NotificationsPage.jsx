import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FiBell, FiCheck, FiTrash2, FiCheckCircle, FiX } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { notificationsAPI } from '../api/notifications';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsAPI.getAll({ page, limit: 20 });
      setNotifications(data.notifications || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const handleClick = (notification) => {
    if (!notification.read) {
      notificationsAPI.markAsRead(notification._id).catch(() => {});
      setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'team_approved':
      case 'event_approved':
        return <FiCheckCircle className="w-5 h-5 text-[#22c55e]" />;
      case 'team_rejected':
      case 'event_rejected':
        return <FiX className="w-5 h-5 text-[#ef4444]" />;
      default:
        return <FiBell className="w-5 h-5 text-[#64748b]" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0a0e14]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <h1 className="text-2xl font-bold text-white tracking-tight">NOTIFICATIONS</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#22c55e] text-white text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-[#64748b] text-sm">Stay up to date with your activity</p>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-[#141c28] border border-[#2a3a4d] text-[#94a3b8] rounded-lg text-sm hover:text-white transition-colors"
                >
                  <FiCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-4 py-2 bg-[#141c28] border border-[#ef4444]/30 text-[#ef4444] rounded-lg text-sm hover:bg-[#ef4444]/10 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-[#0d1219] border border-[#1c2430] rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <FiBell className="w-12 h-12 text-[#2a3a4d] mx-auto mb-4" />
              <p className="text-white font-medium mb-2">No notifications</p>
              <p className="text-[#64748b] text-sm">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleClick(notification)}
                className={`relative flex items-start gap-4 px-6 py-4 border-b border-[#1c2430] last:border-0 cursor-pointer hover:bg-[#141c28]/50 transition-colors group ${
                  !notification.read ? 'bg-[#141c28]/30' : ''
                }`}
              >
                {!notification.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#22c55e]" />
                )}
                <div className="mt-0.5 flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-[#94a3b8]'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-[#64748b] mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-[#4b5563] mt-1">
                    {notification.created_at
                      ? formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })
                      : 'Recently'}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification._id); }}
                      className="p-1.5 rounded-lg bg-[#0d1219] border border-[#2a3a4d] text-[#64748b] hover:text-[#22c55e] transition-colors"
                      title="Mark as read"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(notification._id); }}
                    className="p-1.5 rounded-lg bg-[#0d1219] border border-[#2a3a4d] text-[#64748b] hover:text-[#ef4444] transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-[#0d1219] border border-[#1c2430] text-[#94a3b8] rounded-lg text-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-[#64748b] font-mono">{page} / {pagination.pages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pagination.pages}
              className="px-4 py-2 bg-[#0d1219] border border-[#1c2430] text-[#94a3b8] rounded-lg text-sm hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
