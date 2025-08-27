import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface AdminConfigProps {
  setSuccess: (message: string) => void;
  setError: (message: string) => void;
}

interface GoogleFormSheetConfig {
  google_form_sheet_id: string; // This now represents the form sheet ID
  corresponding_values: Record<string, string>;
}

interface GoogleSheetConfig {
  google_sheet_id: string;
  corresponding_values: Record<string, string>;
}

export function AdminConfig({ setSuccess, setError }: AdminConfigProps) {
  const [formSheetConfig, setFormSheetConfig] = useState<GoogleFormSheetConfig>({
    google_form_sheet_id: '', // This now represents the form sheet ID
    corresponding_values: {}
  });
  
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>({
    google_sheet_id: '',
    corresponding_values: {}
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLookingUpSheet, setIsLookingUpSheet] = useState(false);
  const [isLookingUpFormSheet, setIsLookingUpFormSheet] = useState(false);
  const [sheetColumns, setSheetColumns] = useState<Array<{letter: string, name: string, index: number}>>([]);
  const [formSheetColumns, setFormSheetColumns] = useState<Array<{letter: string, name: string, index: number}>>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

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
          setFormSheetConfig(data.config.googleForm);
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

  const updateFormSheetConfig = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/config/google-form-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formSheetConfig),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Google Form Sheet configuration updated successfully');
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

  const lookupSheetColumns = async () => {
    if (!sheetConfig.google_sheet_id) {
      setError('Please enter a Google Sheet ID first');
      return;
    }

    setIsLookingUpSheet(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/lookup-sheet-columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          google_sheet_id: sheetConfig.google_sheet_id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSheetColumns(data.columns);
        
        // Preserve existing mappings and only add new columns
        const existingMappings = { ...sheetConfig.corresponding_values };
        const newMapping: Record<string, string> = {};
        
        data.columns.forEach((column: {letter: string, name: string, index: number}) => {
          // Use existing mapping if it exists, otherwise empty string
          newMapping[column.name] = existingMappings[column.name] || '';
        });
        
        setSheetConfig({
          ...sheetConfig,
          corresponding_values: newMapping
        });
        setSuccess(`Found ${data.columns.length} columns in the sheet`);
      } else {
        setError(data.error || 'Failed to lookup sheet columns');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLookingUpSheet(false);
    }
  };

  const lookupFormSheetColumns = async () => {
    if (!formSheetConfig.google_form_sheet_id) {
      setError('Please enter a Form Sheet ID first');
      return;
    }

    setIsLookingUpFormSheet(true);
    setError('');

    try {
      const response = await fetch('/api/admin/lookup-sheet-columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetId: formSheetConfig.google_form_sheet_id
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormSheetColumns(data.columns);
        
        // Preserve existing mappings and only add new columns
        const existingMappings = { ...formSheetConfig.corresponding_values };
        const newMapping: Record<string, string> = {};
        
        data.columns.forEach((column: {letter: string, name: string, index: number}) => {
          // Use existing mapping if it exists, otherwise empty string
          newMapping[column.name] = existingMappings[column.name] || '';
        });
        
        setFormSheetConfig({
          ...formSheetConfig,
          corresponding_values: newMapping
        });
        setSuccess(`Found ${data.columns.length} columns in the form sheet`);
      } else {
        setError(data.error || 'Failed to lookup form sheet columns');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLookingUpFormSheet(false);
    }
  };

  const debugCurrentMappings = async () => {
    try {
      setError('');
      const response = await fetch('/api/admin/debug-members');
      const data = await response.json();

      if (data.success) {
        setDebugInfo(data.debug);
        setShowDebug(true);
        setSuccess('Debug information loaded successfully');
      } else {
        setError(data.error || 'Failed to load debug information');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const addFormSheetMapping = () => {
    setFormSheetConfig({
      ...formSheetConfig,
      corresponding_values: {
        ...formSheetConfig.corresponding_values,
        '': ''
      }
    });
  };

  const updateFormSheetMapping = (key: string, newKey: string, value: string) => {
    const newMappings = { ...formSheetConfig.corresponding_values };
    if (key !== newKey && key !== '') {
      delete newMappings[key];
    }
    if (newKey !== '') {
      newMappings[newKey] = value;
    }
    setFormSheetConfig({
      ...formSheetConfig,
      corresponding_values: newMappings
    });
  };

  const removeFormSheetMapping = (key: string) => {
    const newMappings = { ...formSheetConfig.corresponding_values };
    delete newMappings[key];
    setFormSheetConfig({
      ...formSheetConfig,
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
      {/* Google Form Sheet Configuration */}
      <Card title="Google Form Sheet Configuration">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              📋 Form Sheet Integration
            </h4>
            <p className="text-xs text-blue-700">
              Enter the Google Sheet ID that is automatically generated by your Google Form. 
              This sheet contains all form responses and will be processed by the cron job to create new members.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Google Form Sheet ID"
                value={formSheetConfig.google_form_sheet_id}
                onChange={(value) => setFormSheetConfig({...formSheetConfig, google_form_sheet_id: value})}
                placeholder="Enter the Sheet ID generated by your Google Form"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={lookupFormSheetColumns}
                disabled={isLookingUpFormSheet || !formSheetConfig.google_form_sheet_id}
                variant="secondary"
                size="md"
              >
                {isLookingUpFormSheet ? 'Looking up...' : 'Lookup Columns'}
              </Button>
            </div>
          </div>

          {formSheetColumns.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">
                Found {formSheetColumns.length} columns in your form sheet
              </h4>
              <p className="text-xs text-green-700">
                Map each form response column to the corresponding member field below.
              </p>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Form Response Column Mappings
              </label>
              {formSheetColumns.length === 0 && (
                <Button
                  onClick={addFormSheetMapping}
                  size="sm"
                  variant="secondary"
                >
                  Add Mapping
                </Button>
              )}
            </div>
            
            {formSheetColumns.length > 0 ? (
              // Display discovered columns with mapping dropdowns
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-2">
                  <div>Form Sheet Column</div>
                  <div>Member Field</div>
                  <div>Action</div>
                </div>
                {formSheetColumns.map((column, index) => {
                  const memberField = formSheetConfig.corresponding_values[column.name] || '';
                  return (
                    <div key={column.name} className="grid grid-cols-3 gap-2 items-center">
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-green-600 bg-green-100 px-1 rounded text-xs">
                            {column.letter}
                          </span>
                          <span className="text-gray-800">{column.name}</span>
                        </div>
                      </div>
                      <select
                        value={memberField}
                        onChange={(e) => updateFormSheetMapping(column.name, column.name, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select Member Field</option>
                        {memberFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                      <Button
                        onClick={() => removeFormSheetMapping(column.name)}
                        variant="danger"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Manual mapping interface (fallback)
              <div className="space-y-2">
                {Object.entries(formSheetConfig.corresponding_values).map(([formColumn, memberField], index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Form Sheet Column Name"
                      value={formColumn}
                      onChange={(e) => updateFormSheetMapping(formColumn, e.target.value, memberField)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <select
                      value={memberField}
                      onChange={(e) => updateFormSheetMapping(formColumn, formColumn, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Member Field</option>
                      {memberFields.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                    <Button
                      onClick={() => removeFormSheetMapping(formColumn)}
                      variant="danger"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={updateFormSheetConfig}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Update Form Sheet Configuration'}
          </Button>
        </div>
      </Card>

      {/* Member Sheet Configuration */}
      <Card title="Member Sheet Configuration">
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">
              👥 Member Database Sheet
            </h4>
            <p className="text-xs text-purple-700">
              This is your main member database sheet where processed members are stored. 
              The cron job will add new members here after processing form responses.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Member Sheet ID"
                value={sheetConfig.google_sheet_id}
                onChange={(value) => setSheetConfig({...sheetConfig, google_sheet_id: value})}
                placeholder="Enter your Member Database Sheet ID"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={lookupSheetColumns}
                disabled={isLookingUpSheet || !sheetConfig.google_sheet_id}
                variant="secondary"
                size="md"
              >
                {isLookingUpSheet ? 'Looking up...' : 'Lookup Columns'}
              </Button>
            </div>
          </div>

          {sheetColumns.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-900 mb-2">
                Found {sheetColumns.length} columns in your member sheet
              </h4>
              <p className="text-xs text-purple-700">
                Map each member sheet column to the corresponding member field below.
              </p>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Member Sheet Column Mappings
              </label>
              {sheetColumns.length === 0 && (
                <Button
                  onClick={addSheetMapping}
                  size="sm"
                  variant="secondary"
                >
                  Add Manual Mapping
                </Button>
              )}
            </div>
            
            {sheetColumns.length > 0 ? (
              // Display discovered columns with mapping dropdowns
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-2">
                  <div>Member Sheet Column</div>
                  <div>Member Field</div>
                  <div>Action</div>
                </div>
                {sheetColumns.map((column, index) => {
                  const memberField = sheetConfig.corresponding_values[column.name] || '';
                  return (
                    <div key={column.name} className="grid grid-cols-3 gap-2 items-center">
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-purple-600 bg-purple-100 px-1 rounded text-xs">
                            {column.letter}
                          </span>
                          <span className="text-gray-800">{column.name}</span>
                        </div>
                      </div>
                      <select
                        value={memberField}
                        onChange={(e) => updateSheetMapping(column.name, column.name, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select Member Field</option>
                        {memberFields.map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                      <Button
                        onClick={() => removeSheetMapping(column.name)}
                        variant="danger"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Manual mapping interface (fallback)
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
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={updateSheetConfig}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Update Sheet Configuration'}
            </Button>
            <Button
              onClick={debugCurrentMappings}
              variant="secondary"
              disabled={!sheetConfig.google_sheet_id}
            >
              Debug Mappings
            </Button>
          </div>
        </div>
      </Card>

      {/* Debug Information */}
      {showDebug && debugInfo && (
        <Card title="Debug Information">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Current Mapping Debug</h4>
              <Button onClick={() => setShowDebug(false)} variant="secondary" size="sm">
                Close Debug
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium mb-2">Sheet Information</h5>
                <div className="bg-gray-50 p-3 rounded">
                  <p><strong>Sheet ID:</strong> {debugInfo.sheetId}</p>
                  <p><strong>Total Rows:</strong> {debugInfo.totalRows}</p>
                  <p><strong>Headers Found:</strong></p>
                  <div className="text-xs mt-1">
                    {debugInfo.headers?.map((header: string, index: number) => {
                      const letter = String.fromCharCode(65 + index);
                      return (
                        <span key={index} className="inline-block mr-3 mb-1">
                          <span className="font-mono text-blue-600 bg-blue-100 px-1 rounded mr-1">{letter}</span>
                          <span>{header}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Current Mappings</h5>
                <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                  {Object.entries(debugInfo.mappings || {}).map(([sheet, member]) => (
                    <div key={sheet} className="flex justify-between py-1">
                      <span className="text-blue-600">{sheet}</span>
                      <span className="text-green-600">{member || '(unmapped)'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Sample Raw Data</h5>
              <div className="bg-gray-50 p-3 rounded overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(debugInfo.sampleRawData, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Sample Processed Members</h5>
              <div className="bg-gray-50 p-3 rounded overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(debugInfo.processedMembers, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
