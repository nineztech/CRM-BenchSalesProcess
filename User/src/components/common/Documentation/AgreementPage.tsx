// import React, { useState } from "react";
// import SignatureCanvas from "react-signature-canvas";

// type Step = "upload" | "admin-sign" | "client-sign" | "review";

// const AgreementPage: React.FC = () => {
//   const [step, setStep] = useState<Step>("upload");
//   const [file, setFile] = useState<File | null>(null);
//   const [adminSignature, setAdminSignature] = useState<string | null>(null);
//   const [clientSignature, setClientSignature] = useState<string | null>(null);

//   const sigAdminRef = React.useRef<SignatureCanvas>(null);
//   const sigClientRef = React.useRef<SignatureCanvas>(null);

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files && event.target.files.length > 0) {
//       setFile(event.target.files[0]);
//     }
//   };

//   const clearAdminSignature = () => {
//     sigAdminRef.current?.clear();
//     setAdminSignature(null);
//   };

//   const saveAdminSignature = () => {
//     if (sigAdminRef.current && !sigAdminRef.current.isEmpty()) {
//       setAdminSignature(
//         sigAdminRef.current.getTrimmedCanvas().toDataURL("image/png")
//       );
//     }
//   };

//   const clearClientSignature = () => {
//     sigClientRef.current?.clear();
//     setClientSignature(null);
//   };

//   const saveClientSignature = () => {
//     if (sigClientRef.current && !sigClientRef.current.isEmpty()) {
//       setClientSignature(
//         sigClientRef.current.getTrimmedCanvas().toDataURL("image/png")
//       );
//     }
//   };

//   const handleNext = () => {
//     if (step === "upload") setStep("admin-sign");
//     else if (step === "admin-sign") setStep("client-sign");
//     else if (step === "client-sign") setStep("review");
//   };

//   const handlePrev = () => {
//     if (step === "review") setStep("client-sign");
//     else if (step === "client-sign") setStep("admin-sign");
//     else if (step === "admin-sign") setStep("upload");
//   };

//   const handleSave = () => {
//     alert("Agreement signed & saved! (Here you can send to Email Templates)");
//     // You can now send {file, adminSignature, clientSignature} to backend.
//   };

//   return (
//     <div className="p-6 max-w-4xl mx-auto bg-white shadow rounded-lg">
//       <h2 className="text-2xl font-bold mb-4">Agreement Process</h2>

//       {/* Step Indicator */}
//       <div className="flex items-center justify-between mb-6">
//         {["Upload", "Admin Sign", "Client Sign", "Review"].map((label, idx) => (
//           <div
//             key={idx}
//             className={`flex-1 text-center ${
//               step === label.toLowerCase().replace(" ", "-")
//                 ? "font-bold text-blue-600"
//                 : "text-gray-500"
//             }`}
//           >
//             {label}
//           </div>
//         ))}
//       </div>

//       {/* Step 1: Upload */}
//       {step === "upload" && (
//         <div>
//           <h3 className="text-lg font-semibold mb-2">
//             Upload Agreement Document
//           </h3>
//           <input
//             type="file"
//             accept="application/pdf"
//             onChange={handleFileChange}
//             className="border p-2 rounded"
//           />
//           {file && <p className="mt-2">Selected: {file.name}</p>}
//         </div>
//       )}

//       {/* Step 2: Admin Sign */}
//       {step === "admin-sign" && (
//         <div className="grid grid-cols-2 gap-6">
//           <div>
//             <h3 className="text-lg font-semibold mb-2">Agreement Preview</h3>
//             <div className="border rounded h-64 flex items-center justify-center bg-gray-50">
//               {file ? <p>{file.name}</p> : <p>No document uploaded</p>}
//             </div>
//           </div>
//           <div>
//             <h3 className="text-lg font-semibold mb-2">Admin Signature</h3>
//             <SignatureCanvas
//               ref={sigAdminRef}
//               penColor="black"
//               canvasProps={{ className: "border rounded w-full h-40" }}
//             />
//             <div className="mt-2 flex gap-2">
//               <button
//                 onClick={clearAdminSignature}
//                 className="px-3 py-1 bg-gray-300 rounded"
//               >
//                 Clear
//               </button>
//               <button
//                 onClick={saveAdminSignature}
//                 className="px-3 py-1 bg-blue-500 text-white rounded"
//               >
//                 Save
//               </button>
//             </div>
//             {adminSignature && (
//               <img
//                 src={adminSignature}
//                 alt="Admin Signature"
//                 className="mt-2 h-16"
//               />
//             )}
//           </div>
//         </div>
//       )}

//       {/* Step 3: Client Sign */}
//       {step === "client-sign" && (
//         <div className="grid grid-cols-2 gap-6">
//           <div>
//             <h3 className="text-lg font-semibold mb-2">Agreement Preview</h3>
//             <div className="border rounded h-64 flex items-center justify-center bg-gray-50">
//               {file ? <p>{file.name}</p> : <p>No document uploaded</p>}
//             </div>
//           </div>
//           <div>
//             <h3 className="text-lg font-semibold mb-2">Client Signature</h3>
//             <SignatureCanvas
//               ref={sigClientRef}
//               penColor="black"
//               canvasProps={{ className: "border rounded w-full h-40" }}
//             />
//             <div className="mt-2 flex gap-2">
//               <button
//                 onClick={clearClientSignature}
//                 className="px-3 py-1 bg-gray-300 rounded"
//               >
//                 Clear
//               </button>
//               <button
//                 onClick={saveClientSignature}
//                 className="px-3 py-1 bg-blue-500 text-white rounded"
//               >
//                 Save
//               </button>
//             </div>
//             {clientSignature && (
//               <img
//                 src={clientSignature}
//                 alt="Client Signature"
//                 className="mt-2 h-16"
//               />
//             )}
//           </div>
//         </div>
//       )}

//       {/* Step 4: Review */}
//       {step === "review" && (
//         <div>
//           <h3 className="text-lg font-semibold mb-4">Review Agreement</h3>
//           <div className="border p-4 rounded mb-4 bg-gray-50">
//             <p>
//               <strong>Document:</strong>{" "}
//               {file ? file.name : "No document uploaded"}
//             </p>
//             <div className="flex gap-8 mt-4">
//               <div>
//                 <p className="font-semibold">Admin Signature:</p>
//                 {adminSignature ? (
//                   <img
//                     src={adminSignature}
//                     alt="Admin Sign"
//                     className="h-16 mt-2"
//                   />
//                 ) : (
//                   <p className="text-gray-400">Not signed</p>
//                 )}
//               </div>
//               <div>
//                 <p className="font-semibold">Client Signature:</p>
//                 {clientSignature ? (
//                   <img
//                     src={clientSignature}
//                     alt="Client Sign"
//                     className="h-16 mt-2"
//                   />
//                 ) : (
//                   <p className="text-gray-400">Not signed</p>
//                 )}
//               </div>
//             </div>
//           </div>
//           <button
//             onClick={handleSave}
//             className="px-4 py-2 bg-green-600 text-white rounded"
//           >
//             Sign & Save
//           </button>
//         </div>
//       )}

//       {/* Navigation Buttons */}
//       <div className="mt-6 flex justify-between">
//         {step !== "upload" && (
//           <button
//             onClick={handlePrev}
//             className="px-4 py-2 bg-gray-400 text-white rounded"
//           >
//             Previous
//           </button>
//         )}
//         {step !== "review" && (
//           <button
//             onClick={handleNext}
//             className="px-4 py-2 bg-blue-600 text-white rounded ml-auto"
//           >
//             Next
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AgreementPage;
import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import {
  FaSignature,
  FaHandshake,
  FaFont,
  FaPen,
  FaItalic,
  FaBold,
  FaUnderline,
  FaLock,
  FaUnlock,
} from "react-icons/fa";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// Signature Style Types
type Step = "client-sign" | "company-sign";
type SignatureStyle = "simple" | "cursive" | "italic" | "bold" | "underline";

interface SignatureData {
  clientSignature: string;
  companySignature: string;
  clientSignatureStyle: SignatureStyle;
  companySignatureStyle: SignatureStyle;
}

const AgreementPage: React.FC<{ onNext: () => void; onSave: () => void }> = ({
  onNext,
  onSave,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>("client-sign");
  const [numPages, setNumPages] = useState<number | null>(null);

  const [signatureData, setSignatureData] = useState<SignatureData>({
    clientSignature: "",
    companySignature: "",
    clientSignatureStyle: "simple",
    companySignatureStyle: "simple",
  });

  const getSignatureStyle = (style: SignatureStyle): string => {
    switch (style) {
      case "cursive":
        return "font-cursive italic";
      case "italic":
        return "italic";
      case "bold":
        return "font-bold";
      case "underline":
        return "underline";
      default:
        return "";
    }
  };

  const handleSignatureChange = (
    field: "clientSignature" | "companySignature",
    value: string
  ) => {
    setSignatureData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatureStyleChange = (
    field: "clientSignatureStyle" | "companySignatureStyle",
    style: SignatureStyle
  ) => {
    setSignatureData((prev) => ({ ...prev, [field]: style }));
  };

  const handleClientSign = () => {
    if (signatureData.clientSignature.trim()) {
      setCurrentStep("company-sign");
    }
  };

  const handleCompanySign = () => {
    if (signatureData.companySignature.trim()) {
      onSave(); // ✅ Save once both signed
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-2 gap-6">
        {/* 📄 PDF Preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
        >
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            Agreement Document
          </h2>
          <Document
            file="/sample.pdf" // 👉 replace with your generated PDF path
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            className="border rounded-md overflow-auto h-[600px]"
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={500}
              />
            ))}
          </Document>
        </motion.div>

        {/* ✍️ Signature Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
        >
          {currentStep === "client-sign" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <FaSignature className="text-green-600 text-2xl" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Client Signature
                </h3>
              </div>

              {/* Signature Style Buttons */}
              <div className="flex gap-2 mb-4">
                {[
                  { type: "simple", label: "Simple", icon: FaFont },
                  { type: "cursive", label: "Cursive", icon: FaPen },
                  { type: "italic", label: "Italic", icon: FaItalic },
                  { type: "bold", label: "Bold", icon: FaBold },
                  { type: "underline", label: "Underline", icon: FaUnderline },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() =>
                      handleSignatureStyleChange(
                        "clientSignatureStyle",
                        type as SignatureStyle
                      )
                    }
                    className={`p-2 border-2 rounded-lg flex items-center gap-2 ${
                      signatureData.clientSignatureStyle === type
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Enter Client Full Name"
                value={signatureData.clientSignature}
                onChange={(e) =>
                  handleSignatureChange("clientSignature", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
              />

              {signatureData.clientSignature && (
                <div className="mt-2 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-2">
                    Signature Preview:
                  </p>
                  <p
                    className={`text-xl ${getSignatureStyle(
                      signatureData.clientSignatureStyle
                    )} text-green-700`}
                  >
                    {signatureData.clientSignature}
                  </p>
                </div>
              )}

              <button
                onClick={handleClientSign}
                disabled={!signatureData.clientSignature.trim()}
                className="mt-4 flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <FaHandshake />
                Sign as Client
              </button>

              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2 text-yellow-700">
                <FaLock />
                <span>Company Signature Locked until Client signs</span>
              </div>
            </>
          )}

          {currentStep === "company-sign" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <FaSignature className="text-blue-600 text-2xl" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Company Signature
                </h3>
              </div>

              <div className="flex gap-2 mb-4">
                {[
                  { type: "simple", label: "Simple", icon: FaFont },
                  { type: "cursive", label: "Cursive", icon: FaPen },
                  { type: "italic", label: "Italic", icon: FaItalic },
                  { type: "bold", label: "Bold", icon: FaBold },
                  { type: "underline", label: "Underline", icon: FaUnderline },
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() =>
                      handleSignatureStyleChange(
                        "companySignatureStyle",
                        type as SignatureStyle
                      )
                    }
                    className={`p-2 border-2 rounded-lg flex items-center gap-2 ${
                      signatureData.companySignatureStyle === type
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Enter Company Rep. Name"
                value={signatureData.companySignature}
                onChange={(e) =>
                  handleSignatureChange("companySignature", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
              />

              {signatureData.companySignature && (
                <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-2">
                    Signature Preview:
                  </p>
                  <p
                    className={`text-xl ${getSignatureStyle(
                      signatureData.companySignatureStyle
                    )} text-blue-700`}
                  >
                    {signatureData.companySignature}
                  </p>
                </div>
              )}

              <button
                onClick={handleCompanySign}
                disabled={!signatureData.companySignature.trim()}
                className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                <FaHandshake />
                Sign as Company
              </button>

              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700">
                <FaUnlock />
                <span>Company Signature Unlocked (Client has signed)</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AgreementPage;
