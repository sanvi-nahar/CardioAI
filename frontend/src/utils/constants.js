// Global UI styles based on patient status
export const statusStyles = {
    normal: {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-400",
        badge: "bg-green-500",
        icon: "text-green-500",
    },
    warning: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        border: "border-yellow-400",
        badge: "bg-yellow-500",
        icon: "text-yellow-500",
    },
    critical: {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-400",
        badge: "bg-red-500",
        icon: "text-red-500",
    },
    unknown: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-300",
        badge: "bg-gray-500",
        icon: "text-gray-500",
    }
};

export const getStatusStyle = (status) => {
    return statusStyles[status?.toLowerCase()] || statusStyles.unknown;
};

// Date formatter
export const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Invalid Date";

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(d);
};
