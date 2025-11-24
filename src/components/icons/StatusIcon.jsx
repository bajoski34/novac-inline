import React from "react";

// https://www.app.novacpayment.com/_next/static/media/loader.07fd30ec.gif
const StatusIcon = ({status}) => <span className={`novac-status-icon-inner  ${status}`}>
    { status === 'confirming' && '⏳' }
    { status === 'success' && '✅' }
    { status === 'failed' && '❌' }
</span>;
export default StatusIcon;