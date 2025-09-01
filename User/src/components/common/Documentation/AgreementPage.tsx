import React, { useState } from "react";

const AgreementPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Upload Agreement Document</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="border p-2 rounded"
      />
      {file && <p className="mt-2">Selected: {file.name}</p>}
    </div>
  );
};

export default AgreementPage;
