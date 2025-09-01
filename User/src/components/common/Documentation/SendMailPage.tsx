import React, { useState } from "react";

const SendMailPage: React.FC = () => {
  const [sent, setSent] = useState<boolean>(false);

  const handleSendMail = () => {
    setSent(true);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Send Mail Confirmation</h2>
      <button
        onClick={handleSendMail}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {sent ? "Mail Sent ✅" : "Send Mail to Admin"}
      </button>
    </div>
  );
};

export default SendMailPage;
