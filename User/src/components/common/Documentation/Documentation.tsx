// const Documentation: React.FC = () => {
//   const [currentStep, setCurrentStep] = useState<
//     "admin-select" | "review" | "client-sign" | "company-sign" | "complete"
//   >("admin-select");
//   const [selectedUser, setSelectedUser] = useState<string>("");
//   const [selectedFormat, setSelectedFormat] = useState<string>("");
//   const [users, setUsers] = useState<ClientDetails[]>([]);
//   const [packages, setPackages] = useState<PackageDetails[]>([]);
//   const [documentFormats, setDocumentFormats] = useState<DocumentFormat[]>([]);
//   const [selectedPackage, setSelectedPackage] = useState<PackageDetails | null>(
//     null
//   );
//   const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(
//     null
//   );
//   const [isLoading, setIsLoading] = useState(false);
//   const [isAdmin, setIsAdmin] = useState(true); // Set to true for admin view
//   const [signatureData, setSignatureData] = useState<SignatureData>({
//     clientSignature: "",
//     companySignature: "",
//     clientSignatureStyle: "simple",
//     companySignatureStyle: "simple",
//     clientSignedAt: null,
//     companySignedAt: null,
//   });

//   // Company details - Replace with actual data from your API
//   const companyDetails: CompanyDetails = {
//     name: "OPPZ CRM Solutions",
//     address: "456 Innovation Drive, Tech Park, San Francisco, CA 94105",
//     phone: "+1 (555) 987-6543",
//     email: "info@oppzcrm.com",
//     website: "www.oppzcrm.com",
//     registrationNumber: "CA123456789",
//     representative: "Sarah Johnson",
//     designation: "Sales Manager",
//   };

//   // Default document formats
//   const defaultFormats: DocumentFormat[] = [
//     {
//       id: "standard",
//       name: "Standard Enrollment",
//       description: "Basic enrollment document with standard terms",
//       template: "standard",
//       isDefault: true,
//     },
//     {
//       id: "premium",
//       name: "Premium Package",
//       description: "Enhanced enrollment document for premium packages",
//       template: "premium",
//       isDefault: false,
//     },
//     {
//       id: "enterprise",
//       name: "Enterprise Solution",
//       description: "Comprehensive enrollment document for enterprise clients",
//       template: "enterprise",
//       isDefault: false,
//     },
//   ];

//   useEffect(() => {
//     fetchUsers();
//     fetchPackages();
//     setDocumentFormats(defaultFormats);
//   }, []);

//   const fetchUsers = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) return;

//       const response = await axios.get(
//         `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/user/all`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (response.data.success) {
//         setUsers(response.data.data.users || []);
//       }
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       // Use sample data for demo
//       setUsers([
//         {
//           id: 1,
//           firstName: "John",
//           lastName: "Smith",
//           primaryEmail: "john.smith@company.com",
//           primaryContact: "+1 (555) 123-4567",
//           contactNumbers: ["+1 (555) 123-4567"],
//           status: "active",
//           technology: ["React", "Node.js"],
//           country: "USA",
//           visaStatus: "H1B",
//           leadSource: "Website",
//           company: "Tech Solutions Inc.",
//           position: "Chief Technology Officer",
//           address: "123 Business Ave, Suite 100, New York, NY 10001",
//         },
//       ]);
//     }
//   };

//   const fetchPackages = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       if (!token) return;

//       const response = await axios.get(
//         `${
//           process.env.REACT_APP_API_URL || "http://localhost:5000"
//         }/packages/all`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );

//       if (response.data.success) {
//         setPackages(response.data.data || []);
//       }
//     } catch (error) {
//       console.error("Error fetching packages:", error);
//       // Use sample data for demo
//       setPackages([
//         {
//           id: 1,
//           planName: "Premium Business Package",
//           description:
//             "Comprehensive business solution with advanced features and premium support",
//           enrollmentCharge: 2500,
//           offerLetterCharge: 1500,
//           firstYearSalaryPercentage: 15,
//           firstYearFixedPrice: null,
//           features: [
//             "Advanced Lead Management",
//             "Custom Reporting Dashboard",
//             "Priority Customer Support",
//             "API Integration Access",
//             "Advanced Analytics",
//             "Multi-user Access",
//             "Data Backup & Recovery",
//             "Custom Branding",
//           ],
//           status: "active",
//         },
//       ]);
//     }
//   };

//   const handleUserChange = (userId: string) => {
//     setSelectedUser(userId);
//     const user = users.find((u) => u.id.toString() === userId);
//     setSelectedClient(user || null);
//     setSelectedPackage(null);
//   };

//   const handleFormatChange = (formatId: string) => {
//     setSelectedFormat(formatId);
//   };

//   const handlePackageSelect = (packageId: string) => {
//     const pkg = packages.find((p) => p.id.toString() === packageId);
//     setSelectedPackage(pkg || null);
//   };

//   const handleProceedToReview = () => {
//     if (!selectedUser || !selectedFormat || !selectedPackage) {
//       toast.error(
//         "Please select user, document format, and package before proceeding"
//       );
//       return;
//     }
//     setCurrentStep("review");
//   };

//   const handleSignatureChange = (
//     field: "clientSignature" | "companySignature",
//     value: string
//   ) => {
//     setSignatureData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleSignatureStyleChange = (
//     field: "clientSignatureStyle" | "companySignatureStyle",
//     style: any
//   ) => {
//     setSignatureData((prev) => ({ ...prev, [field]: style }));
//   };

//   const getSignatureStyle = (style: string) => {
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

//   const handleClientSign = () => {
//     if (signatureData.clientSignature.trim()) {
//       setSignatureData((prev) => ({
//         ...prev,
//         clientSignedAt: new Date().toISOString(),
//       }));
//       setCurrentStep("company-sign");
//       toast.success(
//         "Client signature recorded successfully! Company signature is now unlocked."
//       );
//     }
//   };

//   const handleCompanySign = () => {
//     if (signatureData.companySignature.trim()) {
//       setSignatureData((prev) => ({
//         ...prev,
//         companySignedAt: new Date().toISOString(),
//       }));
//       setCurrentStep("complete");
//       toast.success(
//         "Company signature recorded successfully! Document is now complete."
//       );
//     }
//   };

//   const handleSendDocument = async () => {
//     if (!selectedClient || !selectedPackage) {
//       toast.error("Client and package information is required");
//       return;
//     }

//     try {
//       setIsLoading(true);
//       // Here you would implement the actual PDF generation and email sending
//       // For now, we'll simulate the process
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       toast.success(
//         `Document sent successfully to ${selectedClient.primaryEmail}`
//       );
//       console.log("Document sent to:", selectedClient.primaryEmail);
//     } catch (error) {
//       console.error("Error sending document:", error);
//       toast.error("Failed to send document. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDownload = () => {
//     console.log("Downloading signed enrollment document...");
//     toast.success("Document download started");
//   };

//   const handlePrint = () => {
//     window.print();
//   };

//   const addNewFormat = () => {
//     const newFormat: DocumentFormat = {
//       id: `custom-${Date.now()}`,
//       name: "Custom Format",
//       description: "Custom document format",
//       template: "custom",
//       isDefault: false,
//     };
//     setDocumentFormats((prev) => [...prev, newFormat]);
//     setSelectedFormat(newFormat.id);
//   };

//   const removeFormat = (formatId: string) => {
//     if (documentFormats.find((f) => f.id === formatId)?.isDefault) {
//       toast.error("Cannot remove default format");
//       return;
//     }
//     setDocumentFormats((prev) => prev.filter((f) => f.id !== formatId));
//     if (selectedFormat === formatId) {
//       setSelectedFormat("");
//     }
//   };

//   if (currentStep === "complete") {
//     return (
//       <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.95 }}
//           animate={{ opacity: 1, scale: 1 }}
//           className="max-w-4xl mx-auto"
//         >
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
//             <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
//             <h1 className="text-3xl font-bold text-gray-900 mb-4">
//               Enrollment Document Successfully Signed!
//             </h1>
//             <p className="text-lg text-gray-600 mb-8">
//               Congratulations! {selectedClient?.firstName}{" "}
//               {selectedClient?.lastName} has been successfully enrolled as a
//               client. The document is now legally binding.
//             </p>

//             <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
//               <div className="flex items-center gap-2 text-green-700">
//                 <FaUserCheck />
//                 <span className="font-medium">
//                   Client: {selectedClient?.firstName} {selectedClient?.lastName}
//                 </span>
//               </div>
//               <div className="flex items-center gap-2 text-green-700 mt-1">
//                 <FaHandshake />
//                 <span className="font-medium">
//                   Package: {selectedPackage?.planName}
//                 </span>
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <button
//                 onClick={handleDownload}
//                 className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
//               >
//                 <FaDownload />
//                 Download Signed Document
//               </button>
//               <button
//                 onClick={handlePrint}
//                 className="flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
//               >
//                 <FaPrint />
//                 Print Document
//               </button>
//             </div>
//           </div>
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <motion.div
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="mb-8"
//       >
//         <h1 className="text-3xl font-bold text-gray-900">
//           Lead Enrollment Document
//         </h1>
//         <p className="mt-2 text-lg text-gray-600">
//           Admin panel for creating and managing enrollment documents
//         </p>

//         {/* Progress Steps */}
//         <div className="mt-6 flex items-center justify-center">
//           <div className="flex items-center space-x-4">
//             <div
//               className={`flex items-center ${
//                 currentStep === "admin-select"
//                   ? "text-blue-600"
//                   : "text-gray-400"
//               }`}
//             >
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
//                   currentStep === "admin-select"
//                     ? "border-blue-600 bg-blue-600 text-white"
//                     : "border-gray-300"
//                 }`}
//               >
//                 1
//               </div>
//               <span className="ml-2 font-medium">Admin Select</span>
//             </div>
//             <div className="w-16 h-0.5 bg-gray-300"></div>
//             <div
//               className={`flex items-center ${
//                 currentStep === "review"
//                   ? "text-blue-600"
//                   : currentStep === "client-sign" ||
//                     currentStep === "company-sign" ||
//                     currentStep === "complete"
//                   ? "text-green-600"
//                   : "text-gray-400"
//               }`}
//             >
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
//                   currentStep === "review"
//                     ? "border-blue-600 bg-blue-600 text-white"
//                     : currentStep === "client-sign" ||
//                       currentStep === "company-sign" ||
//                       currentStep === "complete"
//                     ? "border-green-600 bg-green-600 text-white"
//                     : "border-gray-300"
//                 }`}
//               >
//                 2
//               </div>
//               <span className="ml-2 font-medium">Review</span>
//             </div>
//             <div className="w-16 h-0.5 bg-gray-300"></div>
//             <div
//               className={`flex items-center ${
//                 currentStep === "client-sign"
//                   ? "text-blue-600"
//                   : currentStep === "company-sign" || currentStep === "complete"
//                   ? "text-green-600"
//                   : "text-gray-400"
//               }`}
//             >
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
//                   currentStep === "client-sign"
//                     ? "border-blue-600 bg-blue-600 text-white"
//                     : currentStep === "company-sign" ||
//                       currentStep === "complete"
//                     ? "border-green-600 bg-green-600 text-white"
//                     : "border-gray-300"
//                 }`}
//               >
//                 3
//               </div>
//               <span className="ml-2 font-medium">Client Sign</span>
//             </div>
//             <div className="w-16 h-0.5 bg-gray-300"></div>
//             <div
//               className={`flex items-center ${
//                 currentStep === "company-sign"
//                   ? "text-blue-600"
//                   : currentStep === "complete"
//                   ? "text-green-600"
//                   : "text-gray-400"
//               }`}
//             >
//               <div
//                 className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
//                   currentStep === "company-sign"
//                     ? "border-blue-600 bg-blue-600 text-white"
//                     : currentStep === "complete"
//                     ? "border-green-600 bg-green-600 text-white"
//                     : "border-gray-300"
//                 }`}
//               >
//                 4
//               </div>
//               <span className="ml-2 font-medium">Company Sign</span>
//             </div>
//           </div>
//         </div>
//       </motion.div>

//       <div className="max-w-6xl mx-auto space-y-6">
//         {/* Admin Selection Section */}
//         {currentStep === "admin-select" && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.1 }}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
//           >
//             <div className="flex items-center gap-3 mb-6">
//               <FaUserTie className="text-blue-600 text-2xl" />
//               <div>
//                 <h2 className="text-2xl font-semibold text-gray-900">
//                   Admin Configuration
//                 </h2>
//                 <p className="text-gray-600">
//                   Select user, document format, and package for enrollment
//                 </p>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* User Selection */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Select User (Lead)
//                 </label>
//                 <select
//                   value={selectedUser}
//                   onChange={(e) => handleUserChange(e.target.value)}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   <option value="">Choose a user...</option>
//                   {users.map((user) => (
//                     <option key={user.id} value={user.id}>
//                       {user.firstName} {user.lastName} - {user.primaryEmail}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Document Format Selection */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Document Format
//                 </label>
//                 <div className="flex gap-2">
//                   <select
//                     value={selectedFormat}
//                     onChange={(e) => handleFormatChange(e.target.value)}
//                     className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   >
//                     <option value="">Choose format...</option>
//                     {documentFormats.map((format) => (
//                       <option key={format.id} value={format.id}>
//                         {format.name}
//                       </option>
//                     ))}
//                   </select>
//                   <button
//                     onClick={addNewFormat}
//                     className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                     title="Add new format"
//                   >
//                     <FaPlus />
//                   </button>
//                 </div>
//                 {selectedFormat && (
//                   <div className="mt-2 flex items-center gap-2">
//                     <span className="text-sm text-gray-500">
//                       {
//                         documentFormats.find((f) => f.id === selectedFormat)
//                           ?.description
//                       }
//                     </span>
//                     {!documentFormats.find((f) => f.id === selectedFormat)
//                       ?.isDefault && (
//                       <button
//                         onClick={() => removeFormat(selectedFormat)}
//                         className="text-red-500 hover:text-red-700"
//                         title="Remove format"
//                       >
//                         <FaTrash />
//                       </button>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Package Selection */}
//             {selectedUser && (
//               <div className="mt-6">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Select Package
//                 </label>
//                 <select
//                   value={selectedPackage?.id || ""}
//                   onChange={(e) => handlePackageSelect(e.target.value)}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   <option value="">Choose a package...</option>
//                   {packages.map((pkg) => (
//                     <option key={pkg.id} value={pkg.id}>
//                       {pkg.planName} - ${pkg.enrollmentCharge}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             )}

//             {/* Proceed Button */}
//             <div className="mt-6 flex justify-end">
//               <button
//                 onClick={handleProceedToReview}
//                 disabled={!selectedUser || !selectedFormat || !selectedPackage}
//                 className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//               >
//                 <FaEye />
//                 Review Document
//               </button>
//             </div>
//           </motion.div>
//         )}

//         {/* Package Overview */}
//         {currentStep !== "admin-select" && selectedPackage && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.1 }}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
//           >
//             <div className="flex items-center gap-3 mb-6">
//               <FaFileContract className="text-blue-600 text-2xl" />
//               <div>
//                 <h2 className="text-2xl font-semibold text-gray-900">
//                   Package Details
//                 </h2>
//                 <p className="text-gray-600">Selected package for enrollment</p>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-3">
//                   {selectedPackage.planName}
//                 </h3>
//                 <p className="text-gray-600 mb-4">
//                   {selectedPackage.description}
//                 </p>

//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Enrollment Charge:</span>
//                     <span className="font-bold text-xl text-blue-600">
//                       ${selectedPackage.enrollmentCharge.toLocaleString()}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Offer Letter Charge:</span>
//                     <span className="font-bold text-lg text-green-600">
//                       ${selectedPackage.offerLetterCharge.toLocaleString()}
//                     </span>
//                   </div>
//                   {selectedPackage.firstYearSalaryPercentage && (
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">
//                         First Year Percentage:
//                       </span>
//                       <span className="font-bold text-lg text-purple-600">
//                         {selectedPackage.firstYearSalaryPercentage}%
//                       </span>
//                     </div>
//                   )}
//                   {selectedPackage.firstYearFixedPrice && (
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">
//                         First Year Fixed Price:
//                       </span>
//                       <span className="font-bold text-lg text-purple-600">
//                         ${selectedPackage.firstYearFixedPrice.toLocaleString()}
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               <div>
//                 <h4 className="font-semibold text-gray-900 mb-3">
//                   Package Features
//                 </h4>
//                 <div className="grid grid-cols-1 gap-2">
//                   {selectedPackage.features.map((feature, index) => (
//                     <div key={index} className="flex items-center gap-2">
//                       <FaCheckCircle className="text-green-500 text-sm" />
//                       <span className="text-sm text-gray-700">{feature}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* Client Details */}
//         {currentStep !== "admin-select" && selectedClient && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
//           >
//             <div className="flex items-center gap-3 mb-4">
//               <FaUser className="text-green-600 text-xl" />
//               <h3 className="text-xl font-semibold text-gray-900">
//                 Client Details (Former Lead)
//               </h3>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Full Name
//                 </span>
//                 <p className="text-gray-900">
//                   {selectedClient.firstName} {selectedClient.lastName}
//                 </p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">Email</span>
//                 <p className="text-gray-900">{selectedClient.primaryEmail}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">Phone</span>
//                 <p className="text-gray-900">{selectedClient.primaryContact}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Company
//                 </span>
//                 <p className="text-gray-900">
//                   {selectedClient.company || "Not specified"}
//                 </p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Position
//                 </span>
//                 <p className="text-gray-900">
//                   {selectedClient.position || "Not specified"}
//                 </p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Technology
//                 </span>
//                 <p className="text-gray-900">
//                   {selectedClient.technology.join(", ")}
//                 </p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Country
//                 </span>
//                 <p className="text-gray-900">{selectedClient.country}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Visa Status
//                 </span>
//                 <p className="text-gray-900">{selectedClient.visaStatus}</p>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* Company Details */}
//         {currentStep !== "admin-select" && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.3 }}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
//           >
//             <div className="flex items-center gap-3 mb-4">
//               <FaBuilding className="text-blue-600 text-xl" />
//               <h3 className="text-xl font-semibold text-gray-900">
//                 Company Details
//               </h3>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Company Name
//                 </span>
//                 <p className="text-gray-900">{companyDetails.name}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Registration Number
//                 </span>
//                 <p className="text-gray-900">
//                   {companyDetails.registrationNumber}
//                 </p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Representative
//                 </span>
//                 <p className="text-gray-900">{companyDetails.representative}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Designation
//                 </span>
//                 <p className="text-gray-900">{companyDetails.designation}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">Email</span>
//                 <p className="text-gray-900">{companyDetails.email}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">Phone</span>
//                 <p className="text-gray-900">{companyDetails.phone}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Website
//                 </span>
//                 <p className="text-gray-900">{companyDetails.website}</p>
//               </div>
//               <div>
//                 <span className="text-sm font-medium text-gray-500">
//                   Address
//                 </span>
//                 <p className="text-gray-900">{companyDetails.address}</p>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* Client Signature Section */}
//         {currentStep === "client-sign" && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.5 }}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
//           >
//             <div className="flex items-center gap-3 mb-6">
//               <FaSignature className="text-green-600 text-2xl" />
//               <div>
//                 <h3 className="text-xl font-semibold text-gray-900">
//                   Client Signature
//                 </h3>
//                 <p className="text-gray-600">
//                   Please sign to confirm your enrollment as a client
//                 </p>
//               </div>
//             </div>

//             <div className="space-y-4">
//               <div className="flex items-center gap-4 mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Signature Style:
//                 </label>
//                 <div className="flex gap-2">
//                   {[
//                     { type: "simple", label: "Simple", icon: FaFont },
//                     { type: "cursive", label: "Cursive", icon: FaPen },
//                     { type: "italic", label: "Italic", icon: FaItalic },
//                     { type: "bold", label: "Bold", icon: FaBold },
//                     {
//                       type: "underline",
//                       label: "Underline",
//                       icon: FaUnderline,
//                     },
//                   ].map(({ type, label, icon: Icon }) => (
//                     <button
//                       key={type}
//                       onClick={() =>
//                         handleSignatureStyleChange("clientSignatureStyle", type)
//                       }
//                       className={`p-2 border-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
//                         signatureData.clientSignatureStyle === type
//                           ? "border-green-500 bg-green-50 text-green-700"
//                           : "border-gray-200 hover:border-gray-300 text-gray-600"
//                       }`}
//                     >
//                       <Icon className="text-sm" />
//                       <span className="text-xs">{label}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//                 <FaSignature className="mx-auto h-12 w-12 text-gray-400 mb-4" />
//                 <p className="text-sm text-gray-500 mb-4">
//                   Enter your signature below
//                 </p>
//                 <input
//                   type="text"
//                   placeholder="Enter your full name"
//                   value={signatureData.clientSignature}
//                   onChange={(e) =>
//                     handleSignatureChange("clientSignature", e.target.value)
//                   }
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg mb-4"
//                 />
//                 {signatureData.clientSignature && (
//                   <div className="mt-4 p-4 bg-green-50 rounded-lg">
//                     <p className="text-sm text-green-700 mb-2">
//                       Signature Preview:
//                     </p>
//                     <p
//                       className={`text-xl ${getSignatureStyle(
//                         signatureData.clientSignatureStyle
//                       )} text-green-700`}
//                     >
//                       {signatureData.clientSignature}
//                     </p>
//                   </div>
//                 )}
//               </div>

//               <div className="flex justify-center">
//                 <button
//                   onClick={handleClientSign}
//                   disabled={!signatureData.clientSignature.trim()}
//                   className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//                 >
//                   <FaHandshake />
//                   Sign as Client
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* Company Signature Section */}
//         {currentStep === "company-sign" && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.6 }}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
//           >
//             <div className="flex items-center gap-3 mb-6">
//               <FaSignature className="text-blue-600 text-2xl" />
//               <div>
//                 <h3 className="text-xl font-semibold text-gray-900">
//                   Company Signature
//                 </h3>
//                 <p className="text-gray-600">
//                   Please sign on behalf of the company to confirm this
//                   enrollment
//                 </p>
//               </div>
//             </div>

//             <div className="space-y-4">
//               <div className="flex items-center gap-4 mb-4">
//                 <label className="block text-sm font-medium text-gray-700">
//                   Signature Style:
//                 </label>
//                 <div className="flex gap-2">
//                   {[
//                     { type: "simple", label: "Simple", icon: FaFont },
//                     { type: "cursive", label: "Cursive", icon: FaPen },
//                     { type: "italic", label: "Italic", icon: FaItalic },
//                     { type: "bold", label: "Bold", icon: FaBold },
//                     {
//                       type: "underline",
//                       label: "Underline",
//                       icon: FaUnderline,
//                     },
//                   ].map(({ type, label, icon: Icon }) => (
//                     <button
//                       key={type}
//                       onClick={() =>
//                         handleSignatureStyleChange(
//                           "companySignatureStyle",
//                           type
//                         )
//                       }
//                       className={`p-2 border-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
//                         signatureData.companySignatureStyle === type
//                           ? "border-blue-500 bg-blue-50 text-blue-700"
//                           : "border-gray-200 hover:border-gray-300 text-gray-600"
//                       }`}
//                     >
//                       <Icon className="text-sm" />
//                       <span className="text-xs">{label}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//                 <FaSignature className="mx-auto h-12 w-12 text-gray-400 mb-4" />
//                 <p className="text-sm text-gray-500 mb-4">
//                   Enter company representative signature below
//                 </p>
//                 <input
//                   type="text"
//                   placeholder="Enter representative's full name"
//                   value={signatureData.companySignature}
//                   onChange={(e) =>
//                     handleSignatureChange("companySignature", e.target.value)
//                   }
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg mb-4"
//                 />
//                 {signatureData.companySignature && (
//                   <div className="mt-4 p-4 bg-blue-50 rounded-lg">
//                     <p className="text-sm text-blue-700 mb-2">
//                       Signature Preview:
//                     </p>
//                     <p
//                       className={`text-xl ${getSignatureStyle(
//                         signatureData.companySignatureStyle
//                       )} text-blue-700`}
//                     >
//                       {signatureData.companySignature}
//                     </p>
//                   </div>
//                 )}
//               </div>

//               <div className="flex justify-center">
//                 <button
//                   onClick={handleCompanySign}
//                   disabled={!signatureData.companySignature.trim()}
//                   className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//                 >
//                   <FaHandshake />
//                   Sign as Company
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* Action Buttons */}
//         {currentStep === "review" && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.7 }}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
//           >
//             <div className="text-center">
//               <h3 className="text-xl font-semibold text-gray-900 mb-4">
//                 Ready to Proceed?
//               </h3>
//               <p className="text-gray-600 mb-6">
//                 Please review all the details above. Once confirmed, you can
//                 proceed with the enrollment process.
//               </p>
//               <div className="flex flex-col sm:flex-row gap-4 justify-center">
//                 <button
//                   onClick={() => setCurrentStep("client-sign")}
//                   className="flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
//                 >
//                   <FaHandshake />
//                   Proceed to Client Signature
//                 </button>
//                 <button
//                   onClick={handleSendDocument}
//                   disabled={isLoading}
//                   className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
//                 >
//                   {isLoading ? (
//                     <>
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
//                       Sending...
//                     </>
//                   ) : (
//                     <>
//                       <FaEnvelope />
//                       Send Document to Client
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}

//         {/* Company Signature Lock Status */}
//         {currentStep === "client-sign" && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.8 }}
//             className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
//           >
//             <div className="flex items-center gap-2 text-yellow-700">
//               <FaLock className="text-lg" />
//               <span className="font-medium">Company Signature Locked</span>
//             </div>
//             <p className="text-sm text-yellow-600 mt-1">
//               Company signature will be unlocked once the client signs the
//               document.
//             </p>
//           </motion.div>
//         )}

//         {/* Company Signature Unlocked Status */}
//         {currentStep === "company-sign" && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.8 }}
//             className="bg-green-50 border border-green-200 rounded-lg p-4"
//           >
//             <div className="flex items-center gap-2 text-green-700">
//               <FaUnlock className="text-lg" />
//               <span className="font-medium">Company Signature Unlocked</span>
//             </div>
//             <p className="text-sm text-green-600 mt-1">
//               Client has signed the document. Company can now proceed with
//               signature.
//             </p>
//           </motion.div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Documentation;

// import { useState } from "react";
// import AgreementPage from "./AgreementPage";
// import AccountSaleDoc from "./Doc";
// import { Document, Page, pdfjs } from "react-pdf";
// import "react-pdf/dist/Page/AnnotationLayer.css";
// import "react-pdf/dist/Page/TextLayer.css";

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// import { useDropzone } from "react-dropzone";

// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

// const Documentation: React.FC = () => {
//   const [step, setStep] = useState<
//     "enrolled" | "upload" | "admin-sign" | "client-sign" | "review"
//   >("enrolled");

//   const [file, setFile] = useState<File | null>(null);
//   const [numPages, setNumPages] = useState<number | null>(null);

//   const onDrop = (acceptedFiles: File[]) => {
//     if (acceptedFiles && acceptedFiles[0]) {
//       setFile(acceptedFiles[0]);
//     }
//   };

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: { "application/pdf": [".pdf"] },
//   });

//   const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
//     setNumPages(numPages);
//   };

//   const handleNext = () => {
//     if (step === "enrolled") setStep("upload");
//     else if (step === "upload") setStep("admin-sign");
//     else if (step === "admin-sign") setStep("client-sign");
//     else if (step === "client-sign") setStep("review");
//     else if (step === "review") {
//       alert("All Agreement steps completed!");
//     }
//   };

//   const handlePrev = () => {
//     if (step === "upload") setStep("enrolled");
//     else if (step === "admin-sign") setStep("upload");
//     else if (step === "client-sign") setStep("admin-sign");
//     else if (step === "review") setStep("client-sign");
//   };

//   return (
//     <div className="p-6">
//       {/* STEP 1: Enrolled */}
//       {step === "enrolled" && (
//         <>
//           <AccountSaleDoc />
//           <div className="flex justify-end mt-6">
//             <button
//               onClick={handleNext}
//               className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//             >
//               Next ➡
//             </button>
//           </div>
//         </>
//       )}

//       {/* STEP 2: Upload PDF */}
//       {step === "upload" && (
//         <>
//           <div className="flex flex-col items-center">
//             {/* Drag & Drop Box */}
//             <div
//               {...getRootProps()}
//               className={`w-96 h-40 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition ${
//                 isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-400"
//               }`}
//             >
//               <input {...getInputProps()} />
//               {isDragActive ? (
//                 <p className="text-blue-500">Drop your PDF here...</p>
//               ) : (
//                 <p className="text-gray-500">
//                   Drag & drop a PDF here, or{" "}
//                   <span className="text-blue-600">browse</span>
//                 </p>
//               )}
//             </div>

//             {/* PDF Preview */}
//             {file && (
//               <div className="mt-6 w-full flex flex-col items-center">
//                 <h3 className="mb-2 text-lg font-semibold">PDF Preview</h3>
//                 <div className="border rounded-md p-4 shadow-lg bg-white">
//                   <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
//                     {Array.from(new Array(numPages), (_el, index) => (
//                       <Page
//                         key={`page_${index + 1}`}
//                         pageNumber={index + 1}
//                         renderTextLayer={false}
//                         renderAnnotationLayer={false}
//                         width={500}
//                       />
//                     ))}
//                   </Document>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Navigation */}
//           <div className="flex justify-between mt-6">
//             <button
//               onClick={handlePrev}
//               className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
//             >
//               ⬅ Previous
//             </button>
//             <button
//               onClick={handleNext}
//               disabled={!file} // Prevent next if no file uploaded
//               className={`px-6 py-2 rounded-lg transition ${
//                 file
//                   ? "bg-blue-600 text-white hover:bg-blue-700"
//                   : "bg-gray-300 text-gray-500 cursor-not-allowed"
//               }`}
//             >
//               Next ➡
//             </button>
//           </div>
//         </>
//       )}

//       {/* STEP 3+: Agreement Flow */}
//       {["admin-sign", "client-sign", "review"].includes(step) && (
//         <>
//           <AgreementPage step={step} />
//           <div className="flex justify-between mt-6">
//             <button
//               onClick={handlePrev}
//               className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
//             >
//               ⬅ Previous
//             </button>

//             {step === "review" ? (
//               <button
//                 onClick={() => alert("Agreement saved & finished!")}
//                 className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
//               >
//                 ✅ Save & Finish
//               </button>
//             ) : (
//               <button
//                 onClick={handleNext}
//                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
//               >
//                 Next ➡
//               </button>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default Documentation;

import { useState, useCallback } from "react";
import AgreementPage from "./AgreementPage";
import AccountSaleDoc from "./Doc";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useDropzone } from "react-dropzone"; 

pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const Documentation: React.FC = () => {
  const [step, setStep] = useState<"enrolled" | "upload" | "admin-sign" | "client-sign" | "review" | "send-mail" | "signature" | "completed">("enrolled");
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      setUploadError(null);
      console.log("File selected:", acceptedFiles[0].name, acceptedFiles[0].size);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      "application/pdf": [".pdf"] 
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    console.log("PDF loaded successfully. Pages:", numPages);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Failed to load PDF:", error);
    setUploadError("Failed to load PDF. Please try a different file.");
  };

 const handleUploadToBackend = async () => {
  if (!file) {
    setUploadError("Please select a file first");
    return;
  }

  setIsUploading(true);
  setUploadError(null);

  const formData = new FormData();
  formData.append("pdf", file);

  try {
    console.log("Uploading file:", file.name, file.size);

    const res = await fetch("http://localhost:5006/api/upload-pdf", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Server error response:", errorText);
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Upload Response:", data);

    if (data.success) {
      setUploadedFileName(data.filename); // Store the backend filename
      alert("✅ PDF uploaded successfully!");
    } else {
      throw new Error(data.message || "Upload failed");
    }
  } catch (error) {
    console.error("Upload failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    setUploadError(`❌ PDF upload failed: ${errorMessage}`);
    alert(`❌ PDF upload failed: ${errorMessage}`);
  } finally {
    setIsUploading(false);
  }
};

  const handleSendMail = async () => {
    if (!uploadedFileName) {
      alert("No file uploaded to send!");
      return;
    }

    setIsEmailSending(true);
    try {
      const res = await fetch("http://localhost:5006/send-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "shahsakshi2102@gmail.com",
          subject: "Agreement Document",
          text: "Please find attached agreement.",
          pdfFile: uploadedFileName,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("SendMail Response:", data);
      
      if (data.success) {
        alert("📩 Email sent successfully!");
      } else {
        throw new Error(data.message || "Email sending failed");
      }
    } catch (error) {
      console.error("SendMail failed:", error);
      alert(`❌ Email sending failed: ${error.message}`);
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleNext = () => {
    if (step === "enrolled") setStep("upload");
    else if (step === "upload") setStep("admin-sign");
    else if (step === "admin-sign") setStep("client-sign");
    else if (step === "client-sign") setStep("review");
    else if (step === "review") setStep("send-mail");
    else if (step === "send-mail") setStep("signature");
    else if (step === "signature") setStep("completed");
  };

  const handlePrev = () => {
    if (step === "upload") setStep("enrolled");
    else if (step === "admin-sign") setStep("upload");
    else if (step === "client-sign") setStep("admin-sign");
    else if (step === "review") setStep("client-sign");
    else if (step === "send-mail") setStep("review");
    else if (step === "signature") setStep("send-mail");
    else if (step === "completed") setStep("signature");
  };

  return (
    <div className="p-6">
      {/* STEP 1: Enrolled */}
      {step === "enrolled" && (
        <>
          <AccountSaleDoc />
          <div className="flex justify-end mt-6">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Next ➡
            </button>
          </div>
        </>
      )}

      {/* STEP 2: Upload PDF */}
      {step === "upload" && (
        <>
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4">Upload PDF Document</h2>
            
            {/* Error message display */}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {uploadError}
              </div>
            )}
            
            <div
              {...getRootProps()}
              className={`w-96 h-40 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p className="text-blue-500">Drop your PDF here...</p>
              ) : (
                <p className="text-gray-500">
                  Drag & drop a PDF here, or{" "}
                  <span className="text-blue-600">browse</span>
                </p>
              )}
            </div>

            {file && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">
                  <strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            {/* PDF Preview */}
            {file && (
              <div className="mt-6 w-full flex flex-col items-center">
                <h3 className="mb-2 text-lg font-semibold">PDF Preview</h3>
                <div className="border rounded-md p-4 shadow-lg bg-white max-h-96 overflow-y-auto">
                  <Document 
                    file={file} 
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<div className="text-center p-4">Loading PDF...</div>}
                  >
                    {numPages && Array.from(new Array(Math.min(numPages, 3)), (_el, index) => (
                      <Page
                        key={`page_${index + 1}`}
                        pageNumber={index + 1}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        width={500}
                        className="mb-4"
                      />
                    ))}
                    {numPages && numPages > 3 && (
                      <div className="text-center text-gray-500 mt-4">
                        ... and {numPages - 3} more pages
                      </div>
                    )}
                  </Document>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrev}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              ⬅ Previous
            </button>
            <div className="flex gap-4">
              <button
                onClick={handleUploadToBackend}
                disabled={!file || isUploading}
                className={`px-6 py-2 rounded-lg transition ${
                  file && !isUploading
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isUploading ? "⏳ Uploading..." : "⬆ Upload"}
              </button>
              <button
                onClick={handleNext}
                disabled={!uploadedFileName}
                className={`px-6 py-2 rounded-lg transition ${
                  uploadedFileName
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next ➡
              </button>
            </div>
          </div>
        </>
      )}

      {/* STEP 3+: Agreement Flow */}
      {[
        "admin-sign",
        "client-sign",
        "review",
        "send-mail",
        "signature",
      ].includes(step) && (
        <>
          <AgreementPage step={step} />

          <div className="flex justify-between mt-6">
            <button
              onClick={handlePrev}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              ⬅ Previous
            </button>

            {step === "send-mail" ? (
              <button
                onClick={handleSendMail}
                disabled={isEmailSending}
                className={`px-6 py-2 rounded-lg transition ${
                  isEmailSending
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {isEmailSending ? "📤 Sending..." : "📩 Send Mail"}
              </button>
            ) : step === "review" ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                ✅ Save & Continue
              </button>
            ) : step === "completed" ? null : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Next ➡
              </button>
            )}
          </div>
        </>
      )}

      {/* STEP 8: Completed */}
      {step === "completed" && (
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            🎉 Process Completed!
          </h2>
          <p className="text-gray-700">All steps are done successfully.</p>
        </div>
      )}
    </div>
  );
};

export default Documentation;



// import React, { useState, useRef, useEffect } from 'react';

// interface SignatureData {
//   type: 'typed' | 'drawn' | 'uploaded';
//   data: string;
//   timestamp?: Date;
// }

// interface SignatureOption {
//   id: string;
//   label: string;
//   icon: string;
// }

// interface FontOption {
//   id: string;
//   label: string;
//   style: React.CSSProperties;
// }

// const AgreementWithSignature: React.FC = () => {
//   const [activeTab, setActiveTab] = useState<'type' | 'draw' | 'upload'>('type');
//   const [signatureText, setSignatureText] = useState<string>('');
//   const [selectedFont, setSelectedFont] = useState<string>('cursive');
//   const [signatureHistory, setSignatureHistory] = useState<SignatureData[]>([]);
//   const [signaturePreview, setSignaturePreview] = useState<string>('');
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [isDrawing, setIsDrawing] = useState<boolean>(false);

//   const signatureOptions: SignatureOption[] = [
//     { id: 'type', label: 'Type', icon: 'text_fields' },
//     { id: 'draw', label: 'Draw', icon: 'edit' },
//     { id: 'upload', label: 'Upload', icon: 'cloud_upload' }
//   ];

//   const fontOptions: FontOption[] = [
//     { 
//       id: 'cursive', 
//       label: 'Cursive', 
//       style: { fontFamily: 'Dancing Script, cursive', fontSize: '24px' } 
//     },
//     { 
//       id: 'simple', 
//       label: 'Simple', 
//       style: { fontFamily: 'Arial, sans-serif', fontSize: '18px' } 
//     },
//     { 
//       id: 'bold', 
//       label: 'Bold', 
//       style: { fontFamily: 'Arial, sans-serif', fontSize: '20px', fontWeight: 'bold' } 
//     },
//     { 
//       id: 'taille', 
//       label: 'Taille', 
//       style: { fontFamily: 'Times New Roman, serif', fontSize: '22px', fontStyle: 'italic' } 
//     }
//   ];

//   // Initialize canvas
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const context = canvas.getContext('2d');
//     if (!context) return;

//     // Set canvas size
//     const resizeCanvas = () => {
//       const ratio = window.devicePixelRatio || 1;
//       canvas.width = canvas.offsetWidth * ratio;
//       canvas.height = canvas.offsetHeight * ratio;
//       context.scale(ratio, ratio);
//     };

//     resizeCanvas();
//     window.addEventListener('resize', resizeCanvas);

//     return () => {
//       window.removeEventListener('resize', resizeCanvas);
//     };
//   }, []);

//   // Handle drawing on canvas
//   const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const context = canvas.getContext('2d');
//     if (!context) return;

//     setIsDrawing(true);
    
//     let clientX, clientY;
//     if ('touches' in e) {
//       clientX = e.touches[0].clientX;
//       clientY = e.touches[0].clientY;
//     } else {
//       clientX = e.clientX;
//       clientY = e.clientY;
//     }
    
//     const rect = canvas.getBoundingClientRect();
//     const x = clientX - rect.left;
//     const y = clientY - rect.top;
    
//     context.beginPath();
//     context.moveTo(x, y);
//   };

//   const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
//     if (!isDrawing) return;
    
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const context = canvas.getContext('2d');
//     if (!context) return;

//     let clientX, clientY;
//     if ('touches' in e) {
//       clientX = e.touches[0].clientX;
//       clientY = e.touches[0].clientY;
//     } else {
//       clientX = e.clientX;
//       clientY = e.clientY;
//     }
    
//     const rect = canvas.getBoundingClientRect();
//     const x = clientX - rect.left;
//     const y = clientY - rect.top;
    
//     context.lineTo(x, y);
//     context.strokeStyle = '#000000';
//     context.lineWidth = 2;
//     context.stroke();
//   };

//   const stopDrawing = () => {
//     setIsDrawing(false);
//   };

//   const clearCanvas = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const context = canvas.getContext('2d');
//     if (!context) return;

//     context.clearRect(0, 0, canvas.width, canvas.height);
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       if (event.target?.result) {
//         setSignaturePreview(event.target.result as string);
//       }
//     };
//     reader.readAsDataURL(file);
//   };

//   const applySignature = () => {
//     let signatureData = '';

//     if (activeTab === 'type' && signatureText) {
//       const fontStyle = fontOptions.find(font => font.id === selectedFont)?.style || {};
//       signatureData = JSON.stringify({ text: signatureText, style: fontStyle });
      
//       setSignatureHistory(prev => [...prev, {
//         type: 'typed',
//         data: signatureData,
//         timestamp: new Date()
//       }]);
//     } 
//     else if (activeTab === 'draw') {
//       const canvas = canvasRef.current;
//       if (!canvas) return;

//       signatureData = canvas.toDataURL();
//       setSignatureHistory(prev => [...prev, {
//         type: 'drawn',
//         data: signatureData,
//         timestamp: new Date()
//       }]);
//     }
//     else if (activeTab === 'upload' && signaturePreview) {
//       setSignatureHistory(prev => [...prev, {
//         type: 'uploaded',
//         data: signaturePreview,
//         timestamp: new Date()
//       }]);
//     }

//     // For demo purposes, just show the latest signature
//     if (signatureData) {
//       setSignaturePreview(signatureData);
//     }
//   };

//   const selectHistorySignature = (signature: SignatureData) => {
//     setSignaturePreview(signature.data);
//   };

//   return (
//     <div className="agreement-container">
//       <div className="agreement-content">
//         <div className="agreement-header">
//           <h1>OPPZ CRM Pro</h1>
//           <h2>Agreement Document</h2>
//         </div>
        
//         <div className="agreement-text">
//           <h3>Software License Agreement</h3>
//           <p>This Software License Agreement (the "Agreement") is entered into as of [Date] (the "Effective Date") by and between OPPZ CRM Pro, with an address at [Address] ("Licensor"), and the client who accepts this agreement ("Licensee").</p>
          
//           <h4>1. License Grant</h4>
//           <p>Subject to the terms of this Agreement, Licensor grants to Licensee a non-exclusive, non-transferable license to use the OPPZ CRM Pro software (the "Software").</p>
          
//           <h4>2. Restrictions</h4>
//           <p>Licensee shall not: (a) modify, adapt, alter, translate, or create derivative works of the Software; (b) sublicense, lease, rent, loan, or otherwise transfer the Software to any third party; (c) reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code for the Software.</p>
          
//           <h4>3. Ownership</h4>
//           <p>The Software is licensed, not sold. Licensor retains all right, title, and interest in and to the Software, including all intellectual property rights therein.</p>
          
//           <h4>4. Term and Termination</h4>
//           <p>This Agreement is effective until terminated. Licensee may terminate it at any time by destroying all copies of the Software. This Agreement will terminate immediately without notice from Licensor if Licensee fails to comply with any provision of this Agreement.</p>
          
//           <h4>5. Disclaimer of Warranty</h4>
//           <p>The Software is provided "AS IS" without warranty of any kind. Licensor disclaims all warranties, either express or implied, including, but not limited to, implied warranties of merchantability and fitness for a particular purpose.</p>
          
//           <p>By signing below, Licensee acknowledges that they have read this Agreement, understand it, and agree to be bound by its terms and conditions.</p>
//         </div>
        
//         <div className="signature-preview">
//           {signaturePreview ? (
//             signaturePreview.startsWith('data:image') ? (
//               <img src={signaturePreview} alt="Signature" />
//             ) : (
//               <div style={JSON.parse(signaturePreview).style}>
//                 {JSON.parse(signaturePreview).text}
//               </div>
//             )
//           ) : (
//             <p>Signature will appear here after signing</p>
//           )}
//         </div>
//       </div>
      
//       <div className="signature-panel">
//         <div className="signature-header">
//           <h3>Sign Document</h3>
//         </div>
        
//         <div className="signature-options">
//           {signatureOptions.map(option => (
//             <div
//               key={option.id}
//               className={`signature-option ${activeTab === option.id ? 'active' : ''}`}
//               onClick={() => setActiveTab(option.id as 'type' | 'draw' | 'upload')}
//             >
//               <span className="material-icons">{option.icon}</span>
//               <span>{option.label}</span>
//             </div>
//           ))}
//         </div>
        
//         <div className="signature-tab-content">
//           {activeTab === 'type' && (
//             <div className="type-signature">
//               <input
//                 type="text"
//                 placeholder="Enter your full name"
//                 value={signatureText}
//                 onChange={(e) => setSignatureText(e.target.value)}
//               />
              
//               <div className="font-options">
//                 {fontOptions.map(font => (
//                   <div
//                     key={font.id}
//                     className={`font-option ${selectedFont === font.id ? 'active' : ''}`}
//                     onClick={() => setSelectedFont(font.id)}
//                     style={font.style}
//                   >
//                     {font.label}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
          
//           {activeTab === 'draw' && (
//             <div className="draw-signature">
//               <canvas
//                 ref={canvasRef}
//                 onMouseDown={startDrawing}
//                 onMouseMove={draw}
//                 onMouseUp={stopDrawing}
//                 onMouseLeave={stopDrawing}
//                 onTouchStart={startDrawing}
//                 onTouchMove={draw}
//                 onTouchEnd={stopDrawing}
//               />
//               <button className="clear-button" onClick={clearCanvas}>
//                 Clear
//               </button>
//             </div>
//           )}
          
//           {activeTab === 'upload' && (
//             <div className="upload-signature">
//               <input
//                 type="file"
//                 id="signature-upload"
//                 accept="image/*"
//                 onChange={handleFileUpload}
//               />
//               <label htmlFor="signature-upload">
//                 <span className="material-icons">cloud_upload</span>
//                 <p>Click to upload signature image</p>
//               </label>
//             </div>
//           )}
//         </div>
        
//         <div className="action-buttons">
//           <button className="apply-button" onClick={applySignature}>
//             Apply Signature
//           </button>
//           <button className="cancel-button">
//             Cancel
//           </button>
//         </div>
        
//         <div className="signature-history">
//           <h4>Signature History</h4>
//           {signatureHistory.map((signature, index) => (
//             <div
//               key={index}
//               className="signature-history-item"
//               onClick={() => selectHistorySignature(signature)}
//             >
//               {signature.type === 'typed' ? (
//                 <div style={JSON.parse(signature.data).style}>
//                   {JSON.parse(signature.data).text}
//                 </div>
//               ) : (
//                 <img src={signature.data} alt="Signature" />
//               )}
//               <span>{new Date(signature.timestamp!).toLocaleString()}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AgreementWithSignature;