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
  auto_note_column?: string; // Column letter for tracking processed responses
}

interface GoogleSheetConfig {
  google_sheet_id: string;
  corresponding_values: Record<string, string>;
}

export function AdminConfig({ setSuccess, setError }: AdminConfigProps) {
  const [formSheetConfig, setFormSheetConfig] = useState<GoogleFormSheetConfig>({
    google_form_sheet_id: '', // This now represents the form sheet ID
    corresponding_values: {},
    auto_note_column: undefined
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
      setError('فشل في تحميل الإعدادات');
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
        setSuccess('تم تحديث إعدادات Google Form Sheet بنجاح');
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
        setSuccess('تم تحديث إعدادات Google Sheet بنجاح');
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
      setError('يرجى إدخال معرف Google Sheet أولاً');
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
        setSuccess(`تم العثور على ${data.columns.length} عمود في الورقة`);
      } else {
        setError(data.error || 'فشل في البحث عن أعمدة الورقة');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLookingUpSheet(false);
    }
  };

  const lookupFormSheetColumns = async () => {
    if (!formSheetConfig.google_form_sheet_id) {
      setError('يرجى إدخال معرف Form Sheet أولاً');
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
          google_sheet_id: formSheetConfig.google_form_sheet_id
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
        
        // Auto-detect the next available column for auto_note_column
        let autoNoteColumn = formSheetConfig.auto_note_column;
        if (!autoNoteColumn && data.columns.length > 0) {
          const lastColumnLetter = data.columns[data.columns.length - 1]?.letter;
          if (lastColumnLetter) {
            const nextColumnIndex = lastColumnLetter.charCodeAt(0) - 65 + 1; // Convert A=0, B=1, etc.
            autoNoteColumn = String.fromCharCode(65 + nextColumnIndex); // Convert back to letter
          }
        }

        setFormSheetConfig({
          ...formSheetConfig,
          corresponding_values: newMapping,
          auto_note_column: autoNoteColumn
        });
        setSuccess(`Found ${data.columns.length} columns in the form sheet. Auto-note column set to ${autoNoteColumn}`);
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
        <LoadingSpinner size="lg" text="جاري تحميل الإعدادات..." className="py-12" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Google Form Sheet Configuration */}
      <Card title="إعدادات Google Form Sheet">
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              📋 تكامل Form Sheet
            </h4>
            <p className="text-xs text-blue-700">
              أدخل معرف Google Sheet الذي يتم إنشاؤه تلقائياً بواسطة Google Form الخاص بك.
              تحتوي هذه الورقة على جميع ردود النموذج وسيتم معالجتها بواسطة المهمة المجدولة لإنشاء أعضاء جدد.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="معرف Google Form Sheet"
                value={formSheetConfig.google_form_sheet_id}
                onChange={(value) => setFormSheetConfig({...formSheetConfig, google_form_sheet_id: value})}
                placeholder="أدخل معرف الورقة الذي تم إنشاؤه بواسطة Google Form الخاص بك"
              />
            </div>
            <div className="w-24">
              <Input
                label="عمود الملاحظة التلقائية"
                value={formSheetConfig.auto_note_column || ''}
                onChange={(value) => setFormSheetConfig({...formSheetConfig, auto_note_column: value.toUpperCase() || undefined})}
                placeholder="Z"
                maxLength={1}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={lookupFormSheetColumns}
                disabled={isLookingUpFormSheet || !formSheetConfig.google_form_sheet_id}
                variant="secondary"
                size="md"
              >
                {isLookingUpFormSheet ? 'جاري البحث...' : 'البحث عن الأعمدة'}
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="text-xs font-medium text-yellow-900 mb-1">
              📝 عمود الملاحظة التلقائية
            </h4>
            <p className="text-xs text-yellow-700">
              سيتم استخدام هذا العمود لتتبع ردود النموذج المعالجة لمنع إرسال رسائل بريد إلكتروني مكررة.
              سيقوم النظام تلقائياً بتحديد الإدخالات كـ "معالج" أو "مكرر" في هذا العمود.
            </p>
          </div>

          {formSheetColumns.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">
                تم العثور على {formSheetColumns.length} عمود في ورقة النموذج الخاصة بك
              </h4>
              <p className="text-xs text-green-700">
                قم بربط كل عمود رد نموذج بالحقل المقابل للعضو أدناه.
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
                        إزالة
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
                      placeholder="اسم عمود ورقة النموذج"
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
            {isLoading ? 'جاري التحديث...' : 'تحديث إعدادات Form Sheet'}
          </Button>
        </div>
      </Card>

      {/* Member Sheet Configuration */}
      <Card title="إعدادات ورقة الأعضاء">
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">
              👥 ورقة قاعدة بيانات الأعضاء
            </h4>
            <p className="text-xs text-purple-700">
              هذه هي ورقة قاعدة بيانات الأعضاء الرئيسية حيث يتم حفظ الأعضاء المعالجين.
              ستقوم المهمة المجدولة بإضافة أعضاء جدد هنا بعد معالجة ردود النماذج.
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="معرف ورقة الأعضاء"
                value={sheetConfig.google_sheet_id}
                onChange={(value) => setSheetConfig({...sheetConfig, google_sheet_id: value})}
                placeholder="أدخل معرف ورقة قاعدة بيانات الأعضاء الخاصة بك"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={lookupSheetColumns}
                disabled={isLookingUpSheet || !sheetConfig.google_sheet_id}
                variant="secondary"
                size="md"
              >
                {isLookingUpSheet ? 'جاري البحث...' : 'البحث عن الأعمدة'}
              </Button>
            </div>
          </div>

          {sheetColumns.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-900 mb-2">
                تم العثور على {sheetColumns.length} عمود في ورقة الأعضاء الخاصة بك
              </h4>
              <p className="text-xs text-purple-700">
                قم بربط كل عمود في ورقة الأعضاء بالحقل المقابل للعضو أدناه.
              </p>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                ربط أعمدة ورقة الأعضاء
              </label>
              {sheetColumns.length === 0 && (
                <Button
                  onClick={addSheetMapping}
                  size="sm"
                  variant="secondary"
                >
                  إضافة ربط يدوي
                </Button>
              )}
            </div>
            
            {sheetColumns.length > 0 ? (
              // Display discovered columns with mapping dropdowns
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-500 mb-2">
                  <div>عمود ورقة الأعضاء</div>
                  <div>حقل العضو</div>
                  <div>الإجراء</div>
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
              {isLoading ? 'جاري التحديث...' : 'تحديث إعدادات الورقة'}
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
              <h5 className="font-medium mb-2">عينة البيانات الخام</h5>
              <div className="bg-gray-50 p-3 rounded overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(debugInfo.sampleRawData, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">عينة الأعضاء المعالجين</h5>
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
