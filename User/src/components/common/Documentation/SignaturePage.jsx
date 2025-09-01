import React, { useState } from "react";
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
  FaCheckCircle,
} from "react-icons/fa";

const SignaturePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<
    "client-sign" | "company-sign" | "complete"
  >("client-sign");

  const [signatureData, setSignatureData] = useState({
    clientSignature: "",
    companySignature: "",
    clientSignatureStyle: "simple",
    companySignatureStyle: "simple",
    clientSignedAt: null as string | null,
    companySignedAt: null as string | null,
  });

  const handleSignatureChange = (
    field: "clientSignature" | "companySignature",
    value: string
  ) => {
    setSignatureData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatureStyleChange = (
    field: "clientSignatureStyle" | "companySignatureStyle",
    style: string
  ) => {
    setSignatureData((prev) => ({ ...prev, [field]: style }));
  };

  const getSignatureStyle = (style: string) => {
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

  const handleClientSign = () => {
    if (signatureData.clientSignature.trim()) {
      setSignatureData((prev) => ({
        ...prev,
        clientSignedAt: new Date().toISOString(),
      }));
      setCurrentStep("company-sign");
    }
  };

  const handleCompanySign = () => {
    if (signatureData.companySignature.trim()) {
      setSignatureData((prev) => ({
        ...prev,
        companySignedAt: new Date().toISOString(),
      }));
      setCurrentStep("complete");
    }
  };

  // ✅ Document completed
  if (currentStep === "complete") {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
        >
          <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Document Successfully Signed!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Both client and company have signed the document.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Client Signature Section */}
      {currentStep === "client-sign" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <FaSignature className="text-green-600 text-2xl" />
            <h3 className="text-xl font-semibold text-gray-900">
              Client Signature
            </h3>
          </div>

          {/* Signature Style Options */}
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
                  handleSignatureStyleChange("clientSignatureStyle", type)
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

          {/* Input + Preview */}
          <input
            type="text"
            placeholder="Enter your full name"
            value={signatureData.clientSignature}
            onChange={(e) =>
              handleSignatureChange("clientSignature", e.target.value)
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-4"
          />
          {signatureData.clientSignature && (
            <div className="mt-2 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 mb-2">Signature Preview:</p>
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

          {/* Lock Message */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2 text-yellow-700">
            <FaLock />
            <span>Company Signature Locked until client signs</span>
          </div>
        </motion.div>
      )}

      {/* Company Signature Section */}
      {currentStep === "company-sign" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <FaSignature className="text-blue-600 text-2xl" />
            <h3 className="text-xl font-semibold text-gray-900">
              Company Signature
            </h3>
          </div>

          {/* Signature Style Options */}
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
                  handleSignatureStyleChange("companySignatureStyle", type)
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

          {/* Input + Preview */}
          <input
            type="text"
            placeholder="Enter representative's full name"
            value={signatureData.companySignature}
            onChange={(e) =>
              handleSignatureChange("companySignature", e.target.value)
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
          />
          {signatureData.companySignature && (
            <div className="mt-2 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 mb-2">Signature Preview:</p>
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

          {/* Unlock Message */}
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700">
            <FaUnlock />
            <span>Company Signature Unlocked (Client has signed)</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SignaturePage;
