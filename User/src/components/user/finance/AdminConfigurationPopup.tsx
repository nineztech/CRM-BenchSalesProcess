import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaEdit } from 'react-icons/fa';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

interface EnrolledClient {
  id: number;
  lead_id: number;
  packageid: number | null;
  payable_enrollment_charge: number | null;
  payable_offer_letter_charge: number | null;
  payable_first_year_percentage: number | null;
  payable_first_year_fixed_charge: number | null;
  net_payable_first_year_price: number | null;
  first_year_salary: number | null;
  edited_offer_letter_charge: number | null;
  edited_first_year_percentage: number | null;
  edited_first_year_fixed_charge: number | null;
  edited_net_payable_first_year_price: number | null;
  edited_first_year_salary: number | null;
  Approval_by_sales: boolean;
  Sales_person_id: number | null;
  Approval_by_admin: boolean;
  Admin_id: number | null;
  has_update: boolean;
  final_approval_sales: boolean;
  final_approval_by_admin: boolean;
  has_update_in_final: boolean;
  lead: {
    firstName: string;
    lastName: string;
    primaryEmail: string;
    technology: string[];
    visaStatus: string;
  };
  package: {
    planName: string;
    features: string[];
  } | null;
}

interface FormData {
  approved: boolean;
  edited_offer_letter_charge: number | null;
  edited_first_year_percentage: number | null;
  edited_first_year_fixed_charge: number | null;
  edited_net_payable_first_year_price: number | null;
  edited_first_year_salary: number | null;
  pricing_type: 'percentage' | 'fixed' | null;
  edited_offer_letter_installments: {
    id: number;
    amount: number;
    dueDate: string;
    remark: string;
    installment_number: number;
    is_initial_payment?: boolean;
  }[];
  edited_first_year_installments: {
    id: number;
    amount: number;
    dueDate: string;
    remark: string;
    installment_number: number;
    is_initial_payment?: boolean;
  }[];
}

interface AdminConfigurationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  client: EnrolledClient | null;
  onSuccess: () => void;
}

const AdminConfigurationPopup: React.FC<AdminConfigurationPopupProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    approved: false,
    edited_offer_letter_charge: null,
    edited_first_year_percentage: null,
    edited_first_year_fixed_charge: null,
    edited_net_payable_first_year_price: null,
    edited_first_year_salary: null,
    pricing_type: null,
    edited_offer_letter_installments: [],
    edited_first_year_installments: []
  });
  const [formLoading, setFormLoading] = useState(false);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [installmentError, setInstallmentError] = useState<string | null>(null);

  useEffect(() => {
    if (client && isOpen) {
      setFormData({
        approved: false,
        edited_offer_letter_charge: client.edited_offer_letter_charge || client.payable_offer_letter_charge,
        edited_first_year_percentage: client.edited_first_year_percentage || client.payable_first_year_percentage,
        edited_first_year_fixed_charge: client.edited_first_year_fixed_charge || client.payable_first_year_fixed_charge,
        edited_net_payable_first_year_price: client.edited_net_payable_first_year_price || client.net_payable_first_year_price,
        edited_first_year_salary: client.edited_first_year_salary || client.first_year_salary,
        pricing_type: (client.edited_first_year_percentage || client.payable_first_year_percentage) ? 'percentage' : 'fixed',
        edited_offer_letter_installments: [],
        edited_first_year_installments: []
      });
      fetchInstallments();
    }
  }, [client, isOpen]);

  const handlePricingTypeChange = (type: 'percentage' | 'fixed') => {
    setFormData(prev => ({
      ...prev,
      pricing_type: type,
      edited_first_year_percentage: type === 'percentage' ? prev.edited_first_year_percentage : null,
      edited_first_year_fixed_charge: type === 'fixed' ? prev.edited_first_year_fixed_charge : null
    }));
  };

  const fetchInstallments = async () => {
    if (!client) return;
    
    setLoadingInstallments(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch offer letter installments
      const offerLetterResponse = await axios.get(
        `${BASE_URL}/installments/enrolled-client/${client.id}?charge_type=offer_letter_charge`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Fetch first year installments
      const firstYearResponse = await axios.get(
        `${BASE_URL}/installments/enrolled-client/${client.id}?charge_type=first_year_charge`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (offerLetterResponse.data.success) {
        setFormData(prev => ({
          ...prev,
          edited_offer_letter_installments: offerLetterResponse.data.data.installments.map((inst: any) => ({
            id: inst.id,
            amount: inst.amount,
            dueDate: inst.dueDate,
            remark: inst.remark,
            installment_number: inst.installment_number,
            is_initial_payment: inst.is_initial_payment
          }))
        }));
      }

      if (firstYearResponse.data.success) {
        setFormData(prev => ({
          ...prev,
          edited_first_year_installments: firstYearResponse.data.data.installments.map((inst: any) => ({
            id: inst.id,
            amount: inst.amount,
            dueDate: inst.dueDate,
            remark: inst.remark,
            installment_number: inst.installment_number,
            is_initial_payment: inst.is_initial_payment
          }))
        }));
      }
    } catch (error) {
      console.error('Error fetching installments:', error);
    } finally {
      setLoadingInstallments(false);
    }
  };

  const validateInstallments = (installments: FormData['edited_offer_letter_installments'] | FormData['edited_first_year_installments'], totalAmount: number | null): boolean => {
    if (!totalAmount) return false;
    
    const sum = installments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalAmountNum = Number(totalAmount);
    const isValid = Math.abs(sum - totalAmountNum) < 0.01;
    
    if (!isValid) {
      setInstallmentError(`Total installment amount ($${sum.toFixed(2)}) must equal the charge amount ($${totalAmountNum.toFixed(2)})`);
    } else {
      setInstallmentError(null);
    }
    
    return isValid;
  };

  const handleInstallmentChange = (index: number, field: string, value: string | number, type: 'offer_letter' | 'first_year') => {
    setFormData(prev => {
      const installments = type === 'offer_letter' ? prev.edited_offer_letter_installments : prev.edited_first_year_installments;
      const totalAmount = type === 'offer_letter' ? prev.edited_offer_letter_charge : prev.edited_net_payable_first_year_price;
      
      const newInstallments = [...installments];
      newInstallments[index] = {
        ...newInstallments[index],
        [field]: field === 'amount' ? Number(value) || 0 : value
      };
      
      // Validate total amount whenever an amount is changed
      if (field === 'amount') {
        validateInstallments(newInstallments, totalAmount);
      }
      
      return {
        ...prev,
        [type === 'offer_letter' ? 'edited_offer_letter_installments' : 'edited_first_year_installments']: newInstallments
      };
    });
  };

  const handleFirstYearSalaryChange = (salary: number) => {
    setFormData(prev => {
      const percentage = prev.edited_first_year_percentage || 0;
      const netPayable = (salary * percentage) / 100;
      return {
        ...prev,
        edited_first_year_salary: salary,
        edited_net_payable_first_year_price: netPayable
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    // Validate first year salary is required when first year percentage is used
    if (formData.edited_first_year_percentage && !formData.edited_first_year_salary) {
      toast.error('First year salary is required when first year percentage is used');
      return;
    }

    // Validate installments before proceeding
    if (!formData.approved) {
      const offerLetterValid = validateInstallments(formData.edited_offer_letter_installments, formData.edited_offer_letter_charge);
      const firstYearValid = validateInstallments(formData.edited_first_year_installments, formData.edited_net_payable_first_year_price);
      
      if (!offerLetterValid || !firstYearValid) {
        return; // Stop submission if validation fails
      }
    }

    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;

      const submitData = {
        approved: formData.approved,
        Admin_id: userId,
        updatedBy: userId,
        ...(formData.approved ? {} : {
          edited_offer_letter_charge: formData.edited_offer_letter_charge,
          edited_first_year_percentage: formData.edited_first_year_percentage,
          edited_first_year_fixed_charge: formData.edited_first_year_fixed_charge,
          edited_net_payable_first_year_price: formData.edited_net_payable_first_year_price,
          edited_first_year_salary: formData.edited_first_year_salary
        })
      };

      // First update the enrolled client
      const response = await axios.put(
        `${BASE_URL}/enrolled-clients/final-configuration/admin/${client.id}`,
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // If not approving, update installments
      if (!formData.approved) {
        // Update offer letter installments
        const offerLetterPromises = formData.edited_offer_letter_installments.map(installment => 
          axios.put(
            `${BASE_URL}/installments/admin/approval/${installment.id}`,
            {
              approved: false,
              admin_id: userId,
              edited_amount: installment.amount,
              edited_dueDate: installment.dueDate,
              edited_remark: installment.remark
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
        );

        // Update first year installments
        const firstYearPromises = formData.edited_first_year_installments.map(installment => 
          axios.put(
            `${BASE_URL}/installments/admin/approval/${installment.id}`,
            {
              approved: false,
              admin_id: userId,
              edited_amount: installment.amount,
              edited_dueDate: installment.dueDate,
              edited_remark: installment.remark
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )
        );

        await Promise.all([...offerLetterPromises, ...firstYearPromises]);
      }

      if (response.data.success) {
        onClose();
        onSuccess();
        toast.success(formData.approved ? 'Configuration approved successfully!' : 'Configuration updated and sent back to sales!');
      } else {
        toast.error(response.data.message || 'Error processing configuration');
      }
    } catch (error) {
      console.error('Error processing configuration:', error);
      toast.error('Error processing configuration');
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Not Set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Review Final Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Client Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {client.lead.firstName} {client.lead.lastName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {client.lead.primaryEmail}
              </div>
              <div>
                <span className="font-medium">Technology:</span> {client.lead.technology?.join(', ')}
              </div>
              <div>
                <span className="font-medium">Visa Status:</span> {client.lead.visaStatus}
              </div>
            </div>
          </div>

          {/* Current vs Proposed Changes */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Current Values</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Offer Letter Charge:</span><br />
                  {formatCurrency(client.payable_offer_letter_charge)}
                </div>
                <div>
                  <span className="font-medium">First Year:</span><br />
                  {client.payable_first_year_percentage 
                    ? `${client.payable_first_year_percentage}%` 
                    : formatCurrency(client.payable_first_year_fixed_charge)}
                </div>
                {client.payable_first_year_percentage && (
                  <div>
                    <span className="font-medium">First Year Salary:</span><br />
                    {formatCurrency(client.first_year_salary)}
                  </div>
                )}
                <div>
                  <span className="font-medium">Net Payable First Year:</span><br />
                  {formatCurrency(client.net_payable_first_year_price)}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Proposed Changes</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Offer Letter Charge:</span><br />
                  {formatCurrency(client.edited_offer_letter_charge)}
                </div>
                <div>
                  <span className="font-medium">First Year:</span><br />
                  {client.edited_first_year_percentage 
                    ? `${client.edited_first_year_percentage}%` 
                    : formatCurrency(client.edited_first_year_fixed_charge)}
                </div>
                {client.edited_first_year_percentage && (
                  <div>
                    <span className="font-medium">First Year Salary:</span><br />
                    {formatCurrency(client.edited_first_year_salary)}
                  </div>
                )}
                <div>
                  <span className="font-medium">Net Payable First Year:</span><br />
                  {formatCurrency(client.edited_net_payable_first_year_price)}
                </div>
              </div>
            </div>
          </div>

          {/* Approval Decision */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Approval Decision</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="approval"
                  value="approve"
                  checked={formData.approved === true}
                  onChange={() => setFormData(prev => ({ ...prev, approved: true }))}
                  className="mr-2"
                />
                <FaCheckCircle className="text-green-500 mr-2" />
                Approve as is
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="approval"
                  value="modify"
                  checked={formData.approved === false}
                  onChange={() => setFormData(prev => ({ ...prev, approved: false }))}
                  className="mr-2"
                />
                <FaEdit className="text-blue-500 mr-2" />
                Modify and send back to sales
              </label>
            </div>
          </div>

          {/* Modification Form */}
          {formData.approved === false && (
            <>
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium text-gray-900 mb-4">Modify Configuration</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modified Offer Letter Charge
                    </label>
                    <input
                      type="number"
                      value={formData.edited_offer_letter_charge || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, edited_offer_letter_charge: Number(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Year Pricing Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pricing_type"
                        value="percentage"
                        checked={formData.pricing_type === 'percentage'}
                        onChange={() => handlePricingTypeChange('percentage')}
                        className="mr-2"
                      />
                      Percentage
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pricing_type"
                        value="fixed"
                        checked={formData.pricing_type === 'fixed'}
                        onChange={() => handlePricingTypeChange('fixed')}
                        className="mr-2"
                      />
                      Fixed Amount
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {formData.pricing_type === 'percentage' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modified First Year Salary Percentage (%)
                        </label>
                        <input
                          type="number"
                          value={formData.edited_first_year_percentage || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, edited_first_year_percentage: Number(e.target.value) }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          step="0.01"
                          max="100"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Year Salary ($)
                        </label>
                        <input
                          type="number"
                          value={formData.edited_first_year_salary || ''}
                          onChange={(e) => handleFirstYearSalaryChange(Number(e.target.value))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modified First Year Fixed Charge ($)
                      </label>
                      <input
                        type="number"
                        value={formData.edited_first_year_fixed_charge || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          edited_first_year_fixed_charge: Number(e.target.value),
                          edited_net_payable_first_year_price: Number(e.target.value)
                        }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Net Payable First Year Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.edited_net_payable_first_year_price || ''}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                </div>
              </div>

              {/* Offer Letter Installments Modification Section */}
              <div className="border rounded-lg p-4 bg-blue-50 mt-4">
                <h3 className="font-medium text-gray-900 mb-4">Modify Offer Letter Installments</h3>
                {loadingInstallments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {installmentError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{installmentError}</p>
                      </div>
                    )}
                    
                    {/* Initial Payment Section */}
                    {formData.edited_offer_letter_installments.filter(inst => inst.is_initial_payment).map((installment, index) => (
                      <div key={installment.id} className="grid grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg shadow-sm border-2 border-purple-200">
                        <div className="col-span-3 mb-2">
                          <h4 className="text-sm font-semibold text-purple-700">Initial Payment</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={installment.amount || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_offer_letter_installments.findIndex(i => i.id === installment.id),
                              'amount',
                              e.target.value,
                              'offer_letter'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={installment.dueDate || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_offer_letter_installments.findIndex(i => i.id === installment.id),
                              'dueDate',
                              e.target.value,
                              'offer_letter'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remark
                          </label>
                          <input
                            type="text"
                            value={installment.remark || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_offer_letter_installments.findIndex(i => i.id === installment.id),
                              'remark',
                              e.target.value,
                              'offer_letter'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add a note..."
                          />
                        </div>
                      </div>
                    ))}

                    {/* Regular Installments Section */}
                    {formData.edited_offer_letter_installments.filter(inst => !inst.is_initial_payment).map((installment, index) => (
                      <div key={installment.id} className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow-sm">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={installment.amount || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_offer_letter_installments.findIndex(i => i.id === installment.id),
                              'amount',
                              e.target.value,
                              'offer_letter'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={installment.dueDate || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_offer_letter_installments.findIndex(i => i.id === installment.id),
                              'dueDate',
                              e.target.value,
                              'offer_letter'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remark
                          </label>
                          <input
                            type="text"
                            value={installment.remark || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_offer_letter_installments.findIndex(i => i.id === installment.id),
                              'remark',
                              e.target.value,
                              'offer_letter'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add a note..."
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add total amount display */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Offer Letter Installment Amount:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${formData.edited_offer_letter_installments
                            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium text-gray-700">Required Amount:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${Number(formData.edited_offer_letter_charge || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* First Year Installments Modification Section */}
              <div className="border rounded-lg p-4 bg-blue-50 mt-4">
                <h3 className="font-medium text-gray-900 mb-4">Modify First Year Installments</h3>
                {loadingInstallments ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Initial Payment Section */}
                    {formData.edited_first_year_installments.filter(inst => inst.is_initial_payment).map((installment, index) => (
                      <div key={installment.id} className="grid grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg shadow-sm border-2 border-purple-200">
                        <div className="col-span-3 mb-2">
                          <h4 className="text-sm font-semibold text-purple-700">Initial Payment</h4>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={installment.amount || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_first_year_installments.findIndex(i => i.id === installment.id),
                              'amount',
                              e.target.value,
                              'first_year'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={installment.dueDate || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_first_year_installments.findIndex(i => i.id === installment.id),
                              'dueDate',
                              e.target.value,
                              'first_year'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remark
                          </label>
                          <input
                            type="text"
                            value={installment.remark || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_first_year_installments.findIndex(i => i.id === installment.id),
                              'remark',
                              e.target.value,
                              'first_year'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add a note..."
                          />
                        </div>
                      </div>
                    ))}

                    {/* Regular Installments Section */}
                    {formData.edited_first_year_installments.filter(inst => !inst.is_initial_payment).map((installment, index) => (
                      <div key={installment.id} className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow-sm">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={installment.amount || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_first_year_installments.findIndex(i => i.id === installment.id),
                              'amount',
                              e.target.value,
                              'first_year'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Due Date
                          </label>
                          <input
                            type="date"
                            value={installment.dueDate || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_first_year_installments.findIndex(i => i.id === installment.id),
                              'dueDate',
                              e.target.value,
                              'first_year'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Remark
                          </label>
                          <input
                            type="text"
                            value={installment.remark || ''}
                            onChange={(e) => handleInstallmentChange(
                              formData.edited_first_year_installments.findIndex(i => i.id === installment.id),
                              'remark',
                              e.target.value,
                              'first_year'
                            )}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add a note..."
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add total amount display */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total First Year Installment Amount:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${formData.edited_first_year_installments
                            .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium text-gray-700">Required Amount:</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${Number(formData.edited_net_payable_first_year_price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {formLoading ? 'Processing...' : (formData.approved ? 'Approve' : 'Send Back to Sales')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminConfigurationPopup; 