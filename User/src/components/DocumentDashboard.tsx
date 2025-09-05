// DocumentDashboard.tsx
import React, { useEffect, useState } from "react";

type Recipient = {
  email: string;
  verified: boolean;
};

type DocumentItem = {
  id: number;
  name: string;
  uploadedAt: string;
  status: string;
  recipients: Recipient[];
  signed: boolean;
  thumbnail: string;
};

const mockDocuments: DocumentItem[] = [
  {
    id: 1,
    name: "SAKSHI_SHAH_CV (1)",
    uploadedAt: "09/04/2025 5:28 PM",
    status: "Waiting for others",
    recipients: [
      { email: "shahsakshi02817@gmail.com", verified: true },
      { email: "shahsakshi2102@gmail.com", verified: false }
    ],
    signed: false,
    thumbnail: "/cv_thumbnail.png"
  },
  {
    id: 2,
    name: "Sakshi_Shah_DevOps_Resume",
    uploadedAt: "09/04/2025 10:49 AM",
    status: "Signed",
    recipients: [
      { email: "shahsakshi02817@gmail.com", verified: true }
    ],
    signed: true,
    thumbnail: "/devops_thumbnail.png"
  },
  {
    id: 3,
    name: "Tutorial",
    uploadedAt: "09/04/2025 10:13 AM",
    status: "",
    recipients: [],
    signed: false,
    thumbnail: "/tutorial_thumbnail.png"
  }
];

const DocumentDashboard: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    // TODO: Replace with real API fetch
    setDocuments(mockDocuments);
  }, []);

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="flex gap-2 items-center">
          <button className="bg-white border border-gray-300 px-3 py-2 rounded flex items-center gap-2">
            <span>New Folder</span>
          </button>
          <button className="bg-gray-300 px-3 py-2 rounded text-gray-600 flex items-center gap-2" disabled>
            Send Bundle for Signing
          </button>
          <input type="text" placeholder="Search" className="ml-6 px-3 py-2 border rounded w-64" />
        </div>
      </div>
      <div className="mt-2 bg-white rounded shadow border">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center border-b last:border-none px-4 py-3 hover:bg-gray-50"
          >
            <input type="checkbox" className="mr-4" />
            <img src={doc.thumbnail} alt="thumbnail" className="w-16 h-20 object-contain border mr-4"/>
            <div className="flex-1">
              <div className="font-semibold">{doc.name}</div>
              <div className="text-sm text-gray-500">{doc.uploadedAt}</div>
              {doc.status && (
                <span className={`mt-1 inline-block px-3 py-1 rounded text-xs ${
                  doc.status === "Signed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {doc.status}
                </span>
              )}
              <div className="flex gap-2 mt-1">
                {doc.recipients.map((r) => (
                  <span key={r.email} className="flex items-center text-xs gap-1">
                    {r.verified ? (
                      <span className="text-green-600 font-bold">✔</span>
                    ) : (
                      <span className="text-pink-600 font-bold">✉</span>
                    )}
                    {r.email}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button className="bg-white border px-3 py-1 rounded flex gap-2 items-center hover:bg-gray-100">
                <span role="img" aria-label="Sign">✒️</span> Sign
              </button>
              <button className="bg-white border px-3 py-1 rounded flex gap-2 items-center hover:bg-gray-100">
                <span role="img" aria-label="Send">📧</span> Send for Signing
              </button>
              <button className="ml-3 text-xl text-gray-400 hover:text-gray-700">⋮</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentDashboard;
