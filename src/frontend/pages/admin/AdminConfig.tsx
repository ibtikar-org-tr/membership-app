import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface AdminConfigProps {
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
}

interface GoogleFormConfig {
  google_form_id: string;
  corresponding_values: Record<string, string>;
}

interface GoogleSheetConfig {
  google_sheet_id: string;
  corresponding_values: Record<string, string>;
}

export function AdminConfig({ setSuccess, setError }: AdminConfigProps) {
  const [formConfig, setFormConfig] = useState<GoogleFormConfig>({
    google_form_id: '',
    corresponding_values: {}
  });
  
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>({
    google_sheet_id: '',
    corresponding_values: {}
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Predefined member fields for mapping
  const memberFields = [
    'membership_number', 'ar_name', 'latin_name', 'whatsapp', 'email',
    'sex', 'birth_date', 'country', 'city', 'district', 'university',
    'major', 'graduation_year', 'blood_type', 'password', 'phone'
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();
      
      if (data.success) {
        if (data.config.googleForm) {
          setFormConfig(data.config.googleForm);
        }
        if (data.config.googleSheet) {
          setSheetConfig(data.config.googleSheet);
        }
      }
    } catch (error) {
      setError('Failed to load configuration');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const updateFormConfig = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/config/google-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formConfig),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Google Form configuration updated successfully');
      } else {
        setError(data.error || 'Failed to update configuration');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSheetConfig = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/config/google-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sheetConfig),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Google Sheet configuration updated successfully');
      } else {
        setError(data.error || 'Failed to update configuration');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addFormMapping = () => {
    setFormConfig({
      ...formConfig,
      corresponding_values: {
        ...formConfig.corresponding_values,
        '': ''
      }
    });
  };

  const updateFormMapping = (key: string, newKey: string, value: string) => {
    const newMappings = { ...formConfig.corresponding_values };
    if (key !== newKey && key !== '') {
      delete newMappings[key];
    }
    if (newKey !== '') {
      newMappings[newKey] = value;
    }
    setFormConfig({
      ...formConfig,
      corresponding_values: newMappings
    });
  };

  const removeFormMapping = (key: string) => {
    const newMappings = { ...formConfig.corresponding_values };
    delete newMappings[key];
    setFormConfig({
      ...formConfig,
      corresponding_values: newMappings
    });
  };

  const addSheetMapping = () => {
    setSheetConfig({
      ...sheetConfig,
      corresponding_values: {
        ...sheetConfig.corresponding_values,
        '': ''
      }
    });
  };

  const updateSheetMapping = (key: string, newKey: string, value: string) => {
    const newMappings = { ...sheetConfig.corresponding_values };
    if (key !== newKey && key !== '') {
      delete newMappings[key];
    }
    if (newKey !== '') {
      newMappings[newKey] = value;
    }
    setSheetConfig({
      ...sheetConfig,
      corresponding_values: newMappings
    });
  };

  const removeSheetMapping = (key: string) => {
    const newMappings = { ...sheetConfig.corresponding_values };
    delete newMappings[key];
    setSheetConfig({
      ...sheetConfig,
      corresponding_values: newMappings
    });
  };

  if (isLoadingConfig) {
    return (
      <div className="py-8">
        <LoadingSpinner size="lg" text="Loading configuration..." className="py-12" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Google Form Configuration */}
      <Card title="Google Form Configuration">
        <div className="space-y-4">
          <Input
            label="Google Form ID"
            value={formConfig.google_form_id}
            onChange={(value) => setFormConfig({...formConfig, google_form_id: value})}
            placeholder="Enter Google Form ID"
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Form Field Mappings
              </label>
              <Button
                onClick={addFormMapping}
                size="sm"
                variant="secondary"
              >
                Add Mapping
              </Button>
            </div>
            
            <div className="space-y-2">
              {Object.entries(formConfig.corresponding_values).map(([formField, memberField], index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Form Field ID"
                    value={formField}
                    onChange={(e) => updateFormMapping(formField, e.target.value, memberField)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select
                    value={memberField}
                    onChange={(e) => updateFormMapping(formField, formField, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Member Field</option>
                    {memberFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  <Button
                    onClick={() => removeFormMapping(formField)}
                    variant="danger"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={updateFormConfig}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Update Form Configuration'}
          </Button>
        </div>
      </Card>

      {/* Google Sheet Configuration */}
      <Card title="Google Sheet Configuration">
        <div className="space-y-4">
          <Input
            label="Google Sheet ID"
            value={sheetConfig.google_sheet_id}
            onChange={(value) => setSheetConfig({...sheetConfig, google_sheet_id: value})}
            placeholder="Enter Google Sheet ID"
          />

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Sheet Column Mappings
              </label>
              <Button
                onClick={addSheetMapping}
                size="sm"
                variant="secondary"
              >
                Add Mapping
              </Button>
            </div>
            
            <div className="space-y-2">
              {Object.entries(sheetConfig.corresponding_values).map(([sheetColumn, memberField], index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Sheet Column Header"
                    value={sheetColumn}
                    onChange={(e) => updateSheetMapping(sheetColumn, e.target.value, memberField)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select
                    value={memberField}
                    onChange={(e) => updateSheetMapping(sheetColumn, sheetColumn, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Member Field</option>
                    {memberFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  <Button
                    onClick={() => removeSheetMapping(sheetColumn)}
                    variant="danger"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={updateSheetConfig}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Update Sheet Configuration'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
