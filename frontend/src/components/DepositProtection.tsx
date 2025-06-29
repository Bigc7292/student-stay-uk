
import React, { useState } from 'react';
import { Shield, Camera, Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const DepositProtection = () => {
  const [activeTab, setActiveTab] = useState('checkin');
  const [uploadedPhotos, setUploadedPhotos] = useState({
    moveIn: [],
    moveOut: []
  });
  const [comparisonReport, setComparisonReport] = useState(null);

  // Mock photo upload simulation
  const handlePhotoUpload = (type: 'moveIn' | 'moveOut') => {
    const newPhoto = {
      id: Date.now(),
      name: `${type}_photo_${Date.now()}.jpg`,
      room: 'Living Room',
      date: new Date().toISOString().split('T')[0],
      aiAnalysis: 'No damage detected'
    };

    setUploadedPhotos(prev => ({
      ...prev,
      [type]: [...prev[type], newPhoto]
    }));
  };

  // Mock AI comparison
  const generateComparisonReport = () => {
    const mockReport = {
      overallCondition: 'Good',
      damageScore: 15, // out of 100
      newDamages: [
        { room: 'Kitchen', issue: 'Minor scuff on wall', severity: 'Low', likelihood: 85 },
        { room: 'Bathroom', issue: 'Small stain on carpet', severity: 'Medium', likelihood: 72 }
      ],
      recommendations: [
        'Professional cleaning recommended for carpet stain',
        'Wall scuff likely to be considered normal wear and tear'
      ],
      estimatedDeduction: 45,
      confidence: 89
    };
    setComparisonReport(mockReport);
  };

  const checklistItems = [
    { room: 'Living Room', items: ['Walls', 'Flooring', 'Windows', 'Fixtures'], completed: 4 },
    { room: 'Kitchen', items: ['Appliances', 'Cabinets', 'Countertops', 'Sink'], completed: 3 },
    { room: 'Bedroom', items: ['Walls', 'Flooring', 'Wardrobe', 'Windows'], completed: 4 },
    { room: 'Bathroom', items: ['Toilet', 'Shower/Bath', 'Sink', 'Tiles'], completed: 2 }
  ];

  const depositSchemes = [
    { name: 'Deposit Protection Service (DPS)', type: 'Insurance', fee: 'Free' },
    { name: 'MyDeposits', type: 'Custodial', fee: 'Free' },
    { name: 'Tenancy Deposit Scheme (TDS)', type: 'Both', fee: 'Free' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Deposit Protection</h1>
        <p className="text-gray-600 mb-4">Document property conditions with computer vision to protect your deposit</p>
        
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Photos Uploaded</p>
                  <p className="text-2xl font-bold">{uploadedPhotos.moveIn.length + uploadedPhotos.moveOut.length}</p>
                </div>
                <Camera className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Analysis</p>
                  <p className="text-2xl font-bold">100%</p>
                </div>
                <Shield className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reports Generated</p>
                  <p className="text-2xl font-bold">{comparisonReport ? 1 : 0}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">94%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'checkin', label: 'Move-In Documentation', icon: Upload },
          { id: 'checkout', label: 'Move-Out Documentation', icon: Camera },
          { id: 'comparison', label: 'AI Comparison', icon: FileText },
          { id: 'schemes', label: 'Deposit Schemes', icon: Shield }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === id ? 'bg-white text-green-600 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Move-In Documentation Tab */}
      {activeTab === 'checkin' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Move-In Photo Documentation</CardTitle>
              <p className="text-sm text-gray-600">Document the property condition when you move in to protect your deposit</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-medium mb-2">Upload Move-In Photos</h3>
                    <p className="text-sm text-gray-600 mb-4">Take photos of each room, focusing on walls, floors, and fixtures</p>
                    <Button onClick={() => handlePhotoUpload('moveIn')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Photography Tips</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Take photos in good lighting</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Include timestamp if possible</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Focus on existing damage or issues</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Take wide shots and close-ups</span>
                      </div>
                    </div>
                  </div>
                </div>

                {uploadedPhotos.moveIn.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Uploaded Move-In Photos ({uploadedPhotos.moveIn.length})</h4>
                    <div className="grid md:grid-cols-3 gap-3">
                      {uploadedPhotos.moveIn.map((photo: any) => (
                        <div key={photo.id} className="border rounded-lg p-3">
                          <div className="bg-gray-200 h-32 rounded mb-2 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{photo.room}</div>
                            <div className="text-gray-600">{photo.date}</div>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {photo.aiAnalysis}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Room Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Room-by-Room Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklistItems.map((room) => (
                  <div key={room.room} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{room.room}</h4>
                      <Badge variant={room.completed === room.items.length ? "default" : "secondary"}>
                        {room.completed}/{room.items.length} complete
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {room.items.map((item, index) => (
                        <div key={item} className="flex items-center space-x-2">
                          <CheckCircle className={`w-4 h-4 ${index < room.completed ? 'text-green-500' : 'text-gray-300'}`} />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Move-Out Documentation Tab */}
      {activeTab === 'checkout' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Move-Out Photo Documentation</CardTitle>
              <p className="text-sm text-gray-600">Document the property condition when you move out for comparison</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-medium mb-2">Upload Move-Out Photos</h3>
                    <p className="text-sm text-gray-600 mb-4">Take photos from the same angles as your move-in photos</p>
                    <Button onClick={() => handlePhotoUpload('moveOut')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photos
                    </Button>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">AI Comparison Ready</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Once you upload move-out photos, our AI will automatically compare them with your move-in photos
                      to identify any changes or damage.
                    </p>
                    <Button 
                      onClick={generateComparisonReport}
                      disabled={uploadedPhotos.moveOut.length === 0}
                    >
                      Generate AI Report
                    </Button>
                  </div>
                </div>

                {uploadedPhotos.moveOut.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Uploaded Move-Out Photos ({uploadedPhotos.moveOut.length})</h4>
                    <div className="grid md:grid-cols-3 gap-3">
                      {uploadedPhotos.moveOut.map((photo: any) => (
                        <div key={photo.id} className="border rounded-lg p-3">
                          <div className="bg-gray-200 h-32 rounded mb-2 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">{photo.room}</div>
                            <div className="text-gray-600">{photo.date}</div>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {photo.aiAnalysis}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-4">
          {comparisonReport ? (
            <>
              {/* Overall Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span>AI Comparison Report</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{comparisonReport.overallCondition}</div>
                      <div className="text-sm text-gray-600">Overall Condition</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{comparisonReport.damageScore}%</div>
                      <div className="text-sm text-gray-600">Damage Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{comparisonReport.confidence}%</div>
                      <div className="text-sm text-gray-600">AI Confidence</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Identified Changes</h4>
                      {comparisonReport.newDamages.map((damage, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                          <div>
                            <span className="font-medium">{damage.room}: </span>
                            <span>{damage.issue}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={
                              damage.severity === 'High' ? 'bg-red-100 text-red-800' :
                              damage.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {damage.severity}
                            </Badge>
                            <span className="text-sm text-gray-600">{damage.likelihood}% confidence</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">AI Recommendations</h4>
                      <div className="space-y-2">
                        {comparisonReport.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2">Estimated Impact</h4>
                      <p className="text-sm text-blue-700">
                        Based on our analysis, potential deposit deduction: <strong>£{comparisonReport.estimatedDeduction}</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        This is an estimate. Actual deductions depend on landlord assessment and tenancy agreement terms.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Download Report */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Download Complete Report</h3>
                      <p className="text-sm text-gray-600">Get a detailed PDF report for your records</p>
                    </div>
                    <Button>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Comparison Report Available</h3>
                <p className="text-gray-600 mb-4">
                  Upload both move-in and move-out photos to generate an AI comparison report
                </p>
                <Button onClick={() => setActiveTab('checkin')}>
                  Upload Photos First
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Deposit Schemes Tab */}
      {activeTab === 'schemes' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>UK Deposit Protection Schemes</CardTitle>
              <p className="text-sm text-gray-600">Understanding your deposit protection rights</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {depositSchemes.map((scheme, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{scheme.name}</h4>
                      <Badge variant="outline">{scheme.type}</Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Protection Fee: <span className="font-medium text-green-600">{scheme.fee}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>Important Deposit Rights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-yellow-700">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>Landlords must protect deposits within 30 days of receiving them</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>You must receive prescribed information about your deposit protection</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>Free dispute resolution is available through all schemes</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>Landlords can face penalties for not protecting deposits properly</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dispute Resolution Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                  <div>
                    <div className="font-medium">Try to resolve directly</div>
                    <div className="text-sm text-gray-600">Communicate with your landlord first</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</div>
                  <div>
                    <div className="font-medium">Submit evidence</div>
                    <div className="text-sm text-gray-600">Use your photo documentation and AI report</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">3</div>
                  <div>
                    <div className="font-medium">Independent adjudication</div>
                    <div className="text-sm text-gray-600">Free service through your deposit scheme</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Technology Info */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">AI Technology Behind Deposit Protection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Computer Vision Analysis</h4>
              <div className="space-y-1 text-green-600">
                <div>• Automatic damage detection</div>
                <div>• Before/after comparison</div>
                <div>• Damage severity assessment</div>
                <div>• Normal wear vs. damage classification</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Smart Features</h4>
              <div className="space-y-1 text-green-600">
                <div>• Timestamp verification</div>
                <div>• Confidence scoring</div>
                <div>• Automated report generation</div>
                <div>• Legal precedent matching</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositProtection;
