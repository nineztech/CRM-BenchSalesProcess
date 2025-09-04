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


// import React, { useState } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { motion } from "framer-motion";
// import {
//   FaSignature,
//   FaHandshake,
//   FaFont,
//   FaPen,
//   FaItalic,
//   FaBold,
//   FaUnderline,
//   FaLock,
//   FaUnlock,
// } from "react-icons/fa";
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// // Signature Style Types
// type Step = "client-sign" | "company-sign";
// type SignatureStyle = "simple" | "cursive" | "italic" | "bold" | "underline";

// interface SignatureData {
//   clientSignature: string;
//   companySignature: string;
//   clientSignatureStyle: SignatureStyle;
//   companySignatureStyle: SignatureStyle;
// }

// const AgreementPage: React.FC<{ onNext: () => void; onSave: () => void }> = ({
//   onNext,
//   onSave,
// }) => {
//   const [currentStep, setCurrentStep] = useState<Step>("client-sign");
//   const [numPages, setNumPages] = useState<number | null>(null);

//   const [signatureData, setSignatureData] = useState<SignatureData>({
//     clientSignature: "",
//     companySignature: "",
//     clientSignatureStyle: "simple",
//     companySignatureStyle: "simple",
//   });

//   const getSignatureStyle = (style: SignatureStyle): string => {
//     switch (style) {
//       case "cursive":
//         return "font-cursive italic";
//       case "italic":
//         return "italic";
//       case "bold":
//         return "font-bold";
//       case "underline":
//         return "underline";
//       default:
//         return "";
//     }
//   };

//   const handleSignatureChange = (
//     field: "clientSignature" | "companySignature",
//     value: string
//   ) => {
//     setSignatureData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSignatureStyleChange = (
//     field: "clientSignatureStyle" | "companySignatureStyle",
//     style: SignatureStyle
//   ) => {
//     setSignatureData((prev) => ({ ...prev, [field]: style }));
//   };

//   const handleClientSign = () => {
//     if (signatureData.clientSignature.trim()) {
//       setCurrentStep("company-sign");
//     }
//   };

//   const handleCompanySign = () => {
//     if (signatureData.companySignature.trim()) {
//       onSave(); // ✅ Save once both signed
//     }
//   };

//   return (
//     <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
//       <div className="grid grid-cols-2 gap-6">
//         {/* 📄 PDF Preview */}
//         <motion.div
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="bg-white rounded-xl shadow-md p-4 border border-gray-200"
//         >
//           <h2 className="text-lg font-semibold mb-3 text-gray-800">
//             Agreement Document
//           </h2>
//           <Document
//             file="/sample.pdf" // 👉 replace with your generated PDF path
//             onLoadSuccess={({ numPages }) => setNumPages(numPages)}
//             className="border rounded-md overflow-auto h-[600px]"
//           >
//             {Array.from(new Array(numPages), (el, index) => (
//               <Page
//                 key={`page_${index + 1}`}
//                 pageNumber={index + 1}
//                 width={500}
//               />
//             ))}
//           </Document>
//         </motion.div>

//         {/* ✍️ Signature Section */}
//         <motion.div
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="bg-white rounded-xl shadow-md p-6 border border-gray-200"
//         >
//           {currentStep === "client-sign" && (
//             <>
//               <div className="flex items-center gap-3 mb-6">
//                 <FaSignature className="text-green-600 text-2xl" />
//                 <h3 className="text-xl font-semibold text-gray-900">
//                   Client Signature
//                 </h3>
//               </div>

//               {/* Signature Style Buttons */}
//               <div className="flex gap-2 mb-4">
//                 {[
//                   { type: "simple", label: "Simple", icon: FaFont },
//                   { type: "cursive", label: "Cursive", icon: FaPen },
//                   { type: "italic", label: "Italic", icon: FaItalic },
//                   { type: "bold", label: "Bold", icon: FaBold },
//                   { type: "underline", label: "Underline", icon: FaUnderline },
//                 ].map(({ type, label, icon: Icon }) => (
//                   <button
//                     key={type}
//                     onClick={() =>
//                       handleSignatureStyleChange(
//                         "clientSignatureStyle",
//                         type as SignatureStyle
//                       )
//                     }
//                     className={`p-2 border-2 rounded-lg flex items-center gap-2 ${
//                       signatureData.clientSignatureStyle === type
//                         ? "border-green-500 bg-green-50 text-green-700"
//                         : "border-gray-200 hover:border-gray-300 text-gray-600"
//                     }`}
//                   >
//                     <Icon className="text-sm" />
//                     <span className="text-xs">{label}</span>
//                   </button>
//                 ))}
//               </div>

//               <input
//                 type="text"
//                 placeholder="Enter Client Full Name"
//                 value={signatureData.clientSignature}
//                 onChange={(e) =>
//                   handleSignatureChange("clientSignature", e.target.value)
//                 }
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
//               />

//               {signatureData.clientSignature && (
//                 <div className="mt-2 p-4 bg-green-50 rounded-lg">
//                   <p className="text-sm text-green-700 mb-2">
//                     Signature Preview:
//                   </p>
//                   <p
//                     className={`text-xl ${getSignatureStyle(
//                       signatureData.clientSignatureStyle
//                     )} text-green-700`}
//                   >
//                     {signatureData.clientSignature}
//                   </p>
//                 </div>
//               )}

//               <button
//                 onClick={handleClientSign}
//                 disabled={!signatureData.clientSignature.trim()}
//                 className="mt-4 flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
//               >
//                 <FaHandshake />
//                 Sign as Client
//               </button>

//               <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2 text-yellow-700">
//                 <FaLock />
//                 <span>Company Signature Locked until Client signs</span>
//               </div>
//             </>
//           )}

//           {currentStep === "company-sign" && (
//             <>
//               <div className="flex items-center gap-3 mb-6">
//                 <FaSignature className="text-blue-600 text-2xl" />
//                 <h3 className="text-xl font-semibold text-gray-900">
//                   Company Signature
//                 </h3>
//               </div>

//               <div className="flex gap-2 mb-4">
//                 {[
//                   { type: "simple", label: "Simple", icon: FaFont },
//                   { type: "cursive", label: "Cursive", icon: FaPen },
//                   { type: "italic", label: "Italic", icon: FaItalic },
//                   { type: "bold", label: "Bold", icon: FaBold },
//                   { type: "underline", label: "Underline", icon: FaUnderline },
//                 ].map(({ type, label, icon: Icon }) => (
//                   <button
//                     key={type}
//                     onClick={() =>
//                       handleSignatureStyleChange(
//                         "companySignatureStyle",
//                         type as SignatureStyle
//                       )
//                     }
//                     className={`p-2 border-2 rounded-lg flex items-center gap-2 ${
//                       signatureData.companySignatureStyle === type
//                         ? "border-blue-500 bg-blue-50 text-blue-700"
//                         : "border-gray-200 hover:border-gray-300 text-gray-600"
//                     }`}
//                   >
//                     <Icon className="text-sm" />
//                     <span className="text-xs">{label}</span>
//                   </button>
//                 ))}
//               </div>

//               <input
//                 type="text"
//                 placeholder="Enter Company Rep. Name"
//                 value={signatureData.companySignature}
//                 onChange={(e) =>
//                   handleSignatureChange("companySignature", e.target.value)
//                 }
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
//               />

//               {signatureData.companySignature && (
//                 <div className="mt-2 p-4 bg-blue-50 rounded-lg">
//                   <p className="text-sm text-blue-700 mb-2">
//                     Signature Preview:
//                   </p>
//                   <p
//                     className={`text-xl ${getSignatureStyle(
//                       signatureData.companySignatureStyle
//                     )} text-blue-700`}
//                   >
//                     {signatureData.companySignature}
//                   </p>
//                 </div>
//               )}

//               <button
//                 onClick={handleCompanySign}
//                 disabled={!signatureData.companySignature.trim()}
//                 className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//               >
//                 <FaHandshake />
//                 Sign as Company
//               </button>

//               <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700">
//                 <FaUnlock />
//                 <span>Company Signature Unlocked (Client has signed)</span>
//               </div>
//             </>
//           )}
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default AgreementPage;


// 80% width for PDF, 20% for signature section

// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import {
//   FaHandshake,
//   FaFont,
//   FaPen,
//   FaItalic,
//   FaBold,
//   FaUnderline,
//   FaLock,
//   FaPencilAlt,
//   FaCloudUploadAlt,
//   FaTimes
// } from "react-icons/fa";

// // Signature Style Types
// type Step = "client-sign" | "company-sign";
// type SignatureStyle = "simple" | "cursive" | "italic" | "bold" | "underline";
// type SignatureMode = "type" | "draw" | "upload";

// interface SignatureData {
//   clientSignature: string;
//   companySignature: string;
//   clientSignatureStyle: SignatureStyle;
//   companySignatureStyle: SignatureStyle;
// }

// const AgreementPage: React.FC<{ onNext: () => void; onSave: () => void }> = ({
//   onNext,
//   onSave,
// }) => {
//   const [currentStep, setCurrentStep] = useState<Step>("client-sign");
//   const [signatureMode, setSignatureMode] = useState<SignatureMode>("type");
//   const [uploadedSignature, setUploadedSignature] = useState<string>("");

//   const [signatureData, setSignatureData] = useState<SignatureData>({
//     clientSignature: "",
//     companySignature: "",
//     clientSignatureStyle: "simple",
//     companySignatureStyle: "simple",
//   });

//   const getSignatureStyle = (style: SignatureStyle): string => {
//     switch (style) {
//       case "cursive":
//         return "font-cursive italic";
//       case "italic":
//         return "italic";
//       case "bold":
//         return "font-bold";
//       case "underline":
//         return "underline";
//       default:
//         return "";
//     }
//   };

//   const handleSignatureChange = (
//     field: "clientSignature" | "companySignature",
//     value: string
//   ) => {
//     setSignatureData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSignatureStyleChange = (
//     field: "clientSignatureStyle" | "companySignatureStyle",
//     style: SignatureStyle
//   ) => {
//     setSignatureData((prev) => ({ ...prev, [field]: style }));
//   };

//   const handleClientSign = () => {
//     if (signatureData.clientSignature.trim()) {
//       setCurrentStep("company-sign");
//     }
//   };

//   const handleCompanySign = () => {
//     if (signatureData.companySignature.trim()) {
//       onSave();
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         if (event.target?.result) {
//           setUploadedSignature(event.target.result as string);
//           handleSignatureChange("clientSignature", "Uploaded Signature");
//         }
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-0">
//       <div className="flex gap-0 h-full max-w-full mx-0">
//         {/* 📄 Agreement Document - 80% width */}
//         <motion.div
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="bg-white p-4 border-r border-gray-200 w-[80%]"
//         >
//           <div className="text-center mb-2">
//             <h1 className="text-xl font-bold text-gray-800">OPPZ CRM Pro</h1>
//             <h2 className="text-md font-semibold text-gray-600">Agreement Document</h2>
//           </div>
          
//           <div className="border border-gray-300 rounded h-[400px] flex items-center justify-center bg-gray-100 mt-2">
//             <p className="text-gray-500 text-sm">Failed to load PDF file.</p>
//           </div>

//           <div className="border-t border-gray-300 mt-4 pt-4">
//             <h3 className="text-sm font-semibold text-gray-700">Sign After Client</h3>
//             <p className="text-xs text-gray-600 mt-1">Company signature will appear here after client signs</p>
//           </div>
//         </motion.div>

//         {/* ✍️ Signature Section - 20% width */}
//         <motion.div
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="bg-white p-4 w-[20%]"
//         >
//           <div className="mb-3">
//             <h3 className="text-sm font-semibold text-gray-900">Sign Before Client</h3>
//             <p className="text-xs text-gray-600 mt-1">
//               Please add your signature before the client signs the document
//             </p>
//           </div>

//           {/* Horizontal line separator */}
//           <div className="border-t border-gray-300 my-3"></div>

//           {/* Signature Mode Selection */}
//           <div className="flex flex-col gap-1 mb-3">
//             <button
//               onClick={() => setSignatureMode("type")}
//               className={`p-1 rounded flex items-center justify-center text-xs ${
//                 signatureMode === "type"
//                   ? "bg-blue-100 text-blue-700 border border-blue-500"
//                   : "bg-gray-100 text-gray-700 border border-gray-300"
//               }`}
//             >
//               <FaFont className="text-xs mr-1" />
//               <span>TYPE</span>
//             </button>
//             <button
//               onClick={() => setSignatureMode("draw")}
//               className={`p-1 rounded flex items-center justify-center text-xs ${
//                 signatureMode === "draw"
//                   ? "bg-blue-100 text-blue-700 border border-blue-500"
//                   : "bg-gray-100 text-gray-700 border border-gray-300"
//               }`}
//             >
//               <FaPencilAlt className="text-xs mr-1" />
//               <span>DRAW</span>
//             </button>
//             <button
//               onClick={() => setSignatureMode("upload")}
//               className={`p-1 rounded flex items-center justify-center text-xs ${
//                 signatureMode === "upload"
//                   ? "bg-blue-100 text-blue-700 border border-blue-500"
//                   : "bg-gray-100 text-gray-700 border border-gray-300"
//               }`}
//             >
//               <FaCloudUploadAlt className="text-xs mr-1" />
//               <span>UPLOAD</span>
//             </button>
//           </div>

//           {/* Type Signature */}
//           {signatureMode === "type" && (
//             <>
//               <div className="grid grid-cols-1 gap-1 mb-2">
//                 {[
//                   { type: "simple", label: "A Simple", icon: FaFont },
//                   { type: "cursive", label: "Cursive", icon: FaPen },
//                   { type: "italic", label: "I Italic", icon: FaItalic },
//                   { type: "bold", label: "B Bold", icon: FaBold },
//                   { type: "underline", label: "U Underline", icon: FaUnderline },
//                 ].map(({ type, label, icon: Icon }) => (
//                   <button
//                     key={type}
//                     onClick={() =>
//                       handleSignatureStyleChange(
//                         "clientSignatureStyle",
//                         type as SignatureStyle
//                       )
//                     }
//                     className={`p-1 border rounded flex items-center gap-1 text-xs ${
//                       signatureData.clientSignatureStyle === type
//                         ? "border-green-500 bg-green-50 text-green-700"
//                         : "border-gray-300 text-gray-600"
//                     }`}
//                   >
//                     <Icon className="text-xs" />
//                     <span>{label}</span>
//                   </button>
//                 ))}
//               </div>

//               <input
//                 type="text"
//                 placeholder="Enter Client Full Name"
//                 value={signatureData.clientSignature}
//                 onChange={(e) =>
//                   handleSignatureChange("clientSignature", e.target.value)
//                 }
//                 className="w-full px-2 py-1 border border-gray-300 rounded mb-2 text-xs"
//               />
//             </>
//           )}

//           {/* Draw Signature */}
//           {signatureMode === "draw" && (
//             <div className="mb-2">
//               <div className="h-20 border border-dashed border-gray-300 rounded flex items-center justify-center mb-1">
//                 <p className="text-gray-500 text-xs">Draw signature here</p>
//               </div>
//               <button className="text-xs text-red-500 flex items-center gap-1">
//                 <FaTimes className="text-xs" />
//                 Clear
//               </button>
//             </div>
//           )}

//           {/* Upload Signature */}
//           {signatureMode === "upload" && (
//             <div className="mb-2">
//               <label className="block h-20 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer text-xs">
//                 <FaCloudUploadAlt className="text-md text-gray-400 mb-1" />
//                 <span className="text-gray-500">Upload signature</span>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleFileUpload}
//                   className="hidden"
//                 />
//               </label>
//             </div>
//           )}

//           <button
//             onClick={handleClientSign}
//             disabled={!signatureData.clientSignature.trim()}
//             className="w-full mt-2 flex items-center justify-center gap-1 bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:bg-gray-400 text-xs"
//           >
//             <FaHandshake className="text-xs" />
//             Sign as Client
//           </button>

//           <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2 flex items-start gap-1 text-yellow-700 text-xs">
//             <FaLock className="text-xs mt-0.5" />
//             <span>Sign After Client appears after client signs</span>
//           </div>

//           {/* Sign After Client Section */}
//           {currentStep === "company-sign" && (
//             <div className="mt-3 pt-3 border-t border-gray-200">
//               <div className="mb-2">
//                 <h3 className="text-xs font-semibold text-gray-900">Sign After Client</h3>
//               </div>

//               <input
//                 type="text"
//                 placeholder="Company Representative Name"
//                 value={signatureData.companySignature}
//                 onChange={(e) =>
//                   handleSignatureChange("companySignature", e.target.value)
//                 }
//                 className="w-full px-2 py-1 border border-gray-300 rounded mb-2 text-xs"
//               />

//               <button
//                 onClick={handleCompanySign}
//                 disabled={!signatureData.companySignature.trim()}
//                 className="w-full flex items-center justify-center gap-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400 text-xs"
//               >
//                 <FaHandshake className="text-xs" />
//                 Sign as Company
//               </button>
//             </div>
//           )}
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default AgreementPage;

// import React, { useState } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { motion } from "framer-motion";
// import {
//   FaSignature,
//   FaHandshake,
//   FaFont,
//   FaPen,
//   FaItalic,
//   FaBold,
//   FaUnderline,
//   FaLock,
//   FaUnlock,
//   FaPencilAlt,
//   FaCloudUploadAlt,
//   FaTimes
// } from "react-icons/fa";

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// // Signature Style Types
// type Step = "client-sign" | "company-sign";
// type SignatureStyle = "simple" | "cursive" | "italic" | "bold" | "underline";
// type SignatureMode = "type" | "draw" | "upload";

// interface SignatureData {
//   clientSignature: string;
//   companySignature: string;
//   clientSignatureStyle: SignatureStyle;
//   companySignatureStyle: SignatureStyle;
// }

// const AgreementPage: React.FC<{ onNext: () => void; onSave: () => void }> = ({
//   onNext,
//   onSave,
// }) => {
//   const [currentStep, setCurrentStep] = useState<Step>("client-sign");
//   const [numPages, setNumPages] = useState<number | null>(null);
//   const [signatureMode, setSignatureMode] = useState<SignatureMode>("type");
//   const [drawnSignature, setDrawnSignature] = useState<string>("");
//   const [uploadedSignature, setUploadedSignature] = useState<string>("");

//   const [signatureData, setSignatureData] = useState<SignatureData>({
//     clientSignature: "",
//     companySignature: "",
//     clientSignatureStyle: "simple",
//     companySignatureStyle: "simple",
//   });

//   const getSignatureStyle = (style: SignatureStyle): string => {
//     switch (style) {
//       case "cursive":
//         return "font-cursive italic";
//       case "italic":
//         return "italic";
//       case "bold":
//         return "font-bold";
//       case "underline":
//         return "underline";
//       default:
//         return "";
//     }
//   };

//   const handleSignatureChange = (
//     field: "clientSignature" | "companySignature",
//     value: string
//   ) => {
//     setSignatureData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSignatureStyleChange = (
//     field: "clientSignatureStyle" | "companySignatureStyle",
//     style: SignatureStyle
//   ) => {
//     setSignatureData((prev) => ({ ...prev, [field]: style }));
//   };

//   const handleClientSign = () => {
//     if (signatureData.clientSignature.trim()) {
//       setCurrentStep("company-sign");
//     }
//   };

//   const handleCompanySign = () => {
//     if (signatureData.companySignature.trim()) {
//       onSave(); // ✅ Save once both signed
//     }
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         if (event.target?.result) {
//           setUploadedSignature(event.target.result as string);
//           handleSignatureChange("clientSignature", "Uploaded Signature");
//         }
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   return (
//     <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
//       <div className="flex gap-2">
//         {/* 📄 PDF Preview - 70% width */}
//         <motion.div
//           initial={{ opacity: 0, x: -20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="bg-white rounded-xl shadow-md p-4 border border-gray-200 w-8/12"
//         >
//           <h2 className="text-lg font-semibold mb-3 text-gray-800">
//             Agreement Document
//           </h2>
//           <Document
//             file="/sample.pdf" // 👉 replace with your generated PDF path
//             onLoadSuccess={({ numPages }) => setNumPages(numPages)}
//             className="border rounded-md overflow-auto h-[600px]"
//           >
//             {Array.from(new Array(numPages || 1), (el, index) => (
//               <Page
//                 key={`page_${index + 1}`}
//                 pageNumber={index + 1}
//                 width={500}
//               />
//             ))}
//           </Document>
//         </motion.div>

//         {/* ✍️ Signature Section - 30% width */}
//         <motion.div
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           className="bg-white rounded-xl shadow-md p-6 border border-gray-200 w-5/12"
//         >
//           <div className="mb-6">
//             <h3 className="text-xl font-semibold text-gray-900 mb-2">
//               Sign Before Client
//             </h3>
//             <p className="text-sm text-gray-600">
//               Please add your signature before the client signs the document
//             </p>
//           </div>

//           {/* Signature Mode Selection */}
//           <div className="flex gap-2 mb-6">
//             <button
//               onClick={() => setSignatureMode("type")}
//               className={`flex-1 p-3 rounded-lg flex flex-col items-center justify-center ${
//                 signatureMode === "type"
//                   ? "bg-blue-100 text-blue-700 border-2 border-blue-500"
//                   : "bg-gray-100 text-gray-700 border-2 border-gray-200"
//               }`}
//             >
//               <FaFont className="text-xl mb-1" />
//               <span className="text-xs">TYPE</span>
//             </button>
//             <button
//               onClick={() => setSignatureMode("draw")}
//               className={`flex-1 p-3 rounded-lg flex flex-col items-center justify-center ${
//                 signatureMode === "draw"
//                   ? "bg-blue-100 text-blue-700 border-2 border-blue-500"
//                   : "bg-gray-100 text-gray-700 border-2 border-gray-200"
//               }`}
//             >
//               <FaPencilAlt className="text-xl mb-1" />
//               <span className="text-xs">DRAW</span>
//             </button>
//             <button
//               onClick={() => setSignatureMode("upload")}
//               className={`flex-1 p-3 rounded-lg flex flex-col items-center justify-center ${
//                 signatureMode === "upload"
//                   ? "bg-blue-100 text-blue-700 border-2 border-blue-500"
//                   : "bg-gray-100 text-gray-700 border-2 border-gray-200"
//               }`}
//             >
//               <FaCloudUploadAlt className="text-xl mb-1" />
//               <span className="text-xs">UPLOAD</span>
//             </button>
//           </div>

//           {/* Type Signature */}
//           {signatureMode === "type" && (
//             <>
//               <div className="flex gap-2 mb-4 flex-wrap">
//                 {[
//                   { type: "simple", label: "Simple", icon: FaFont },
//                   { type: "cursive", label: "Cursive", icon: FaPen },
//                   { type: "italic", label: "Italic", icon: FaItalic },
//                   { type: "bold", label: "Bold", icon: FaBold },
//                   { type: "underline", label: "Underline", icon: FaUnderline },
//                 ].map(({ type, label, icon: Icon }) => (
//                   <button
//                     key={type}
//                     onClick={() =>
//                       handleSignatureStyleChange(
//                         "clientSignatureStyle",
//                         type as SignatureStyle
//                       )
//                     }
//                     className={`p-2 border-2 rounded-lg flex items-center gap-1 ${
//                       signatureData.clientSignatureStyle === type
//                         ? "border-green-500 bg-green-50 text-green-700"
//                         : "border-gray-200 hover:border-gray-300 text-gray-600"
//                     }`}
//                   >
//                     <Icon className="text-sm" />
//                     <span className="text-xs">{label}</span>
//                   </button>
//                 ))}
//               </div>

//               <input
//                 type="text"
//                 placeholder="Enter Client Full Name"
//                 value={signatureData.clientSignature}
//                 onChange={(e) =>
//                   handleSignatureChange("clientSignature", e.target.value)
//                 }
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
//               />
//             </>
//           )}

//           {/* Draw Signature */}
//           {signatureMode === "draw" && (
//             <div className="mb-4">
//               <div className="h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
//                 <p className="text-gray-500">Draw your signature here</p>
//                 {/* You would implement a drawing canvas here */}
//               </div>
//               <button className="text-sm text-red-500 flex items-center gap-1">
//                 <FaTimes />
//                 Clear Drawing
//               </button>
//             </div>
//           )}

//           {/* Upload Signature */}
//           {signatureMode === "upload" && (
//             <div className="mb-4">
//               <label className="block h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer">
//                 <FaCloudUploadAlt className="text-3xl text-gray-400 mb-2" />
//                 <span className="text-gray-500">Click to upload signature</span>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleFileUpload}
//                   className="hidden"
//                 />
//               </label>
//               {uploadedSignature && (
//                 <div className="mt-2 p-2 bg-gray-100 rounded-lg">
//                   <img 
//                     src={uploadedSignature} 
//                     alt="Uploaded signature" 
//                     className="h-10 object-contain mx-auto"
//                   />
//                 </div>
//               )}
//             </div>
//           )}

//           {signatureData.clientSignature && (
//             <div className="mt-4 p-4 bg-green-50 rounded-lg mb-4">
//               <p className="text-sm text-green-700 mb-2">Signature Preview:</p>
//               {signatureMode === "upload" && uploadedSignature ? (
//                 <img 
//                   src={uploadedSignature} 
//                   alt="Signature" 
//                   className="h-12 object-contain"
//                 />
//               ) : (
//                 <p
//                   className={`text-xl ${getSignatureStyle(
//                     signatureData.clientSignatureStyle
//                   )} text-green-700`}
//                 >
//                   {signatureData.clientSignature}
//                 </p>
//               )}
//             </div>
//           )}

//           <button
//             onClick={handleClientSign}
//             disabled={!signatureData.clientSignature.trim()}
//             className="w-full mt-4 flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
//           >
//             <FaHandshake />
//             Sign as Client
//           </button>

//           <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2 text-yellow-700">
//             <FaLock />
//             <span>Sign After Client section will appear after client signs</span>
//           </div>

//           {/* Sign After Client Section (will be shown after client signs) */}
//           {currentStep === "company-sign" && (
//             <div className="mt-6 pt-6 border-t border-gray-200">
//               <div className="mb-4">
//                 <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                   Sign After Client
//                 </h3>
//                 <p className="text-sm text-gray-600">
//                   Add company signature after client has signed
//                 </p>
//               </div>

//               <input
//                 type="text"
//                 placeholder="Enter Company Representative Name"
//                 value={signatureData.companySignature}
//                 onChange={(e) =>
//                   handleSignatureChange("companySignature", e.target.value)
//                 }
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
//               />

//               {signatureData.companySignature && (
//                 <div className="mt-2 p-4 bg-blue-50 rounded-lg mb-4">
//                   <p className="text-sm text-blue-700 mb-2">
//                     Company Signature Preview:
//                   </p>
//                   <p
//                     className={`text-xl ${getSignatureStyle(
//                       signatureData.companySignatureStyle
//                     )} text-blue-700`}
//                   >
//                     {signatureData.companySignature}
//                   </p>
//                 </div>
//               )}

//               <button
//                 onClick={handleCompanySign}
//                 disabled={!signatureData.companySignature.trim()}
//                 className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//               >
//                 <FaHandshake />
//                 Sign as Company
//               </button>
//             </div>
//           )}
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default AgreementPage;


import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFont,
  FaPencilAlt,
  FaCloudUploadAlt,
  FaTimes,
  FaCheck,
  FaEye,
  FaDownload,
  FaUndo
} from "react-icons/fa";

// Signature Style Types
type SignatureMode = "type" | "draw" | "upload";

interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface SignatureData {
  signature: string;
  style: string;
  mode: SignatureMode;
  position?: SignaturePosition;
  imageData?: string;
}

const predefinedSignatures = [
  { id: 1, name: "Sakshi shah", style: "font-serif italic text-2xl" },
  { id: 2, name: "Sakshi shah", style: "font-mono text-xl" },
  { id: 3, name: "Sakshi shah", style: "font-sans font-bold text-xl" },
  { id: 4, name: "Sakshi shah", style: "font-serif text-xl" },
  { id: 5, name: "Sakshi shah", style: "font-cursive italic text-2xl transform -skew-x-12" },
  { id: 6, name: "Sakshi shah", style: "font-sans underline text-xl" },
  { id: 7, name: "Sakshi shah", style: "font-serif font-light text-xl tracking-wide" },
  { id: 8, name: "Sakshi shah", style: "font-mono font-bold text-lg" },
  { id: 9, name: "Sakshi shah", style: "font-sans italic font-semibold text-xl" },
  { id: 10, name: "Sakshi shah", style: "font-serif text-xl transform rotate-1" },
  { id: 11, name: "Sakshi shah", style: "font-cursive text-2xl text-blue-600" },
  { id: 12, name: "Sakshi shah", style: "font-sans font-black text-lg tracking-widest" }
];

const AgreementPage: React.FC = () => {
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureMode, setSignatureMode] = useState<SignatureMode>("type");
  const [selectedSignature, setSelectedSignature] = useState(predefinedSignatures[0]);
  const [customSignature, setCustomSignature] = useState("");
  const [drawnSignature, setDrawnSignature] = useState<string>("");
  const [uploadedSignature, setUploadedSignature] = useState<string>("");
  const [placedSignatures, setPlacedSignatures] = useState<SignatureData[]>([]);
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<SignatureData | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Drawing functionality
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setDrawnSignature(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignature("");
  };

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedSignature(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureSelect = () => {
    let signatureData: SignatureData;
    
    if (signatureMode === "type") {
      signatureData = {
        signature: customSignature || selectedSignature.name,
        style: selectedSignature.style,
        mode: "type"
      };
    } else if (signatureMode === "draw") {
      signatureData = {
        signature: "Hand-drawn signature",
        style: "",
        mode: "draw",
        imageData: drawnSignature
      };
    } else {
      signatureData = {
        signature: "Uploaded signature",
        style: "",
        mode: "upload",
        imageData: uploadedSignature
      };
    }
    
    setCurrentSignature(signatureData);
    setIsPlacingSignature(true);
    setShowSignatureModal(false);
  };

  const handlePDFClick = (e: React.MouseEvent) => {
    if (!isPlacingSignature || !currentSignature) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newSignature: SignatureData = {
      ...currentSignature,
      position: {
        x,
        y,
        width: 120,
        height: 40,
        page: 1
      }
    };
    
    setPlacedSignatures(prev => [...prev, newSignature]);
    setIsPlacingSignature(false);
    setCurrentSignature(null);
  };

  const removeSignature = (index: number) => {
    setPlacedSignatures(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex gap-6">
        {/* PDF Preview with Signature Placement */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 flex-1"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Agreement Document</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSignatureModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FaPencilAlt />
                Add Signature
              </button>
              <button className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition">
                <FaEye />
                Preview
              </button>
              <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                <FaDownload />
                Download
              </button>
            </div>
          </div>

          <div 
            className="relative border rounded-lg overflow-hidden bg-white"
            style={{ height: "600px" }}
            onClick={handlePDFClick}
          >
            {/* Mock PDF content */}
            <div className="absolute inset-0 p-8 text-gray-700 text-sm leading-relaxed">
              <h3 className="text-lg font-bold mb-4 text-center">AGREEMENT DOCUMENT</h3>
              <p className="mb-4">This agreement is made between the parties mentioned below:</p>
              <p className="mb-4">Party A: Client Name</p>
              <p className="mb-4">Party B: Company Name</p>
              <p className="mb-4">Terms and conditions of this agreement are as follows:</p>
              <p className="mb-4">1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
              <p className="mb-4">2. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <p className="mb-4">3. Ut enim ad minim veniam, quis nostrud exercitation.</p>
              
              <div className="mt-16">
                <div className="flex justify-between">
                  <div>
                    <p className="mb-2">Client Signature:</p>
                    <div className="border-b border-gray-400 w-48 h-8"></div>
                    <p className="text-xs mt-1">Date: ___________</p>
                  </div>
                  <div>
                    <p className="mb-2">Company Representative:</p>
                    <div className="border-b border-gray-400 w-48 h-8"></div>
                    <p className="text-xs mt-1">Date: ___________</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Placed Signatures Overlay */}
            {placedSignatures.map((sig, index) => (
              <div
                key={index}
                className="absolute group cursor-pointer"
                style={{
                  left: sig.position?.x,
                  top: sig.position?.y,
                  width: sig.position?.width,
                  height: sig.position?.height,
                }}
              >
                {sig.mode === "type" ? (
                  <div className={`${sig.style} text-blue-600 bg-blue-50 p-2 rounded border-2 border-blue-200`}>
                    {sig.signature}
                  </div>
                ) : (
                  <img 
                    src={sig.imageData} 
                    alt="Signature" 
                    className="w-full h-full object-contain bg-blue-50 rounded border-2 border-blue-200"
                  />
                )}
                <button
                  onClick={() => removeSignature(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  <FaTimes />
                </button>
              </div>
            ))}

            {isPlacingSignature && (
              <div className="absolute inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <p className="text-gray-700 mb-2">Click where you want to place the signature</p>
                  <button
                    onClick={() => {
                      setIsPlacingSignature(false);
                      setCurrentSignature(null);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Signature Tools Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 w-80"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Signature Tools</h3>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Signatures placed: {placedSignatures.length}
            </div>
            
            {placedSignatures.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Placed Signatures:</h4>
                {placedSignatures.map((sig, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700 truncate">{sig.signature}</span>
                    <button
                      onClick={() => removeSignature(index)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowSignatureModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <FaPencilAlt />
              Create New Signature
            </button>

            {placedSignatures.length > 0 && (
              <button className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition">
                <FaCheck />
                Complete Document
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Enhanced Signature Modal */}
      <AnimatePresence>
        {showSignatureModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowSignatureModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Signature</h2>
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Signature Mode Tabs */}
              <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
                {[
                  { mode: "type", label: "TYPE", icon: FaFont },
                  { mode: "draw", label: "DRAW", icon: FaPencilAlt },
                  { mode: "upload", label: "UPLOAD", icon: FaCloudUploadAlt }
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setSignatureMode(mode as SignatureMode)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition ${
                      signatureMode === mode
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    <Icon className="text-lg" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* TYPE Mode */}
              {signatureMode === "type" && (
                <div>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={customSignature}
                      onChange={(e) => setCustomSignature(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {predefinedSignatures.map((sig) => (
                      <div
                        key={sig.id}
                        onClick={() => setSelectedSignature(sig)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedSignature.id === sig.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className={`${sig.style} text-center`}>
                          {customSignature || sig.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                    <div className={`${selectedSignature.style} text-center py-2`}>
                      {customSignature || selectedSignature.name}
                    </div>
                  </div>
                </div>
              )}

              {/* DRAW Mode */}
              {signatureMode === "draw" && (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Draw your signature below:</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <canvas
                        ref={canvasRef}
                        width={720}
                        height={200}
                        className="border border-gray-200 rounded cursor-crosshair w-full"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={clearCanvas}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm"
                      >
                        <FaUndo />
                        Clear
                      </button>
                      <div className="flex gap-2">
                        <div className="w-4 h-4 bg-black rounded-full border-2 border-gray-300 cursor-pointer"></div>
                        <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-gray-300 cursor-pointer"></div>
                        <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-gray-300 cursor-pointer"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOAD Mode */}
              {signatureMode === "upload" && (
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
                    <label className="cursor-pointer block">
                      <FaCloudUploadAlt className="text-4xl text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Click to upload signature image</p>
                      <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadedSignature && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                      <img 
                        src={uploadedSignature} 
                        alt="Uploaded signature" 
                        className="h-16 object-contain mx-auto border rounded"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignatureSelect}
                  disabled={
                    (signatureMode === "type" && !customSignature && !selectedSignature) ||
                    (signatureMode === "draw" && !drawnSignature) ||
                    (signatureMode === "upload" && !uploadedSignature)
                  }
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Sign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPlacingSignature && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg">
          <p className="text-sm">Click on the document to place your signature</p>
        </div>
      )}
    </div>
  );
};

export default AgreementPage;