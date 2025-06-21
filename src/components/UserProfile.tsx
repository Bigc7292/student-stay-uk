import React, { useState, useEffect } from 'react';
import { User, Settings, History, Search, Bell, LogOut, Edit, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { authService, User as UserType, UserPreferences } from '@/services/authService';

interface UserProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ open, onOpenChange }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setPreferences(currentUser?.preferences || null);

    const unsubscribe = authService.onAuthStateChange((user) => {
      setUser(user);
      setPreferences(user?.preferences || null);
    });

    return unsubscribe;
  }, []);

  const handleSavePreferences = async () => {
    if (!preferences) return;

    setIsSaving(true);
    try {
      await authService.updatePreferences(preferences);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    onOpenChange(false);
  };

  const handleRemoveSavedSearch = async (searchId: string) => {
    try {
      await authService.removeSavedSearch(searchId);
    } catch (error) {
      console.error('Failed to remove saved search:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'under_review': return 'bg-yellow-500';
      case 'submitted': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user || !preferences) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>My Profile</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preferences" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preferences" className="flex items-center space-x-1">
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-1">
              <History className="w-4 h-4" />
              <span>Applications</span>
            </TabsTrigger>
            <TabsTrigger value="searches" className="flex items-center space-x-1">
              <Search className="w-4 h-4" />
              <span>Saved Searches</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Account Information</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm text-gray-600">{user.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div>
                    <Label>Member Since</Label>
                    <p className="text-sm text-gray-600">
                      {user.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label>Last Login</Label>
                    <p className="text-sm text-gray-600">
                      {user.lastLogin.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Housing Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="university">University</Label>
                    <Input
                      id="university"
                      value={preferences.university}
                      onChange={(e) => setPreferences({ ...preferences, university: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Preferred Location</Label>
                    <Input
                      id="location"
                      value={preferences.preferredLocation}
                      onChange={(e) => setPreferences({ ...preferences, preferredLocation: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Max Budget (£/week)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={preferences.maxBudget}
                      onChange={(e) => setPreferences({ ...preferences, maxBudget: parseInt(e.target.value) })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Accommodation Type</Label>
                    <Select
                      value={preferences.accommodationType}
                      onValueChange={(value: any) => setPreferences({ ...preferences, accommodationType: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="shared">Shared House</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                        <SelectItem value="ensuite">En-suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Preferred Amenities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Wi-Fi', 'Laundry', 'Gym', 'Kitchen', 'Study Room', 'Parking', '24/7 Security', 'Garden'].map((amenity) => (
                      <Badge
                        key={amenity}
                        variant={preferences.amenities.includes(amenity) ? "default" : "outline"}
                        className={`cursor-pointer ${!isEditing ? 'pointer-events-none' : ''}`}
                        onClick={() => {
                          if (!isEditing) return;
                          const newAmenities = preferences.amenities.includes(amenity)
                            ? preferences.amenities.filter(a => a !== amenity)
                            : [...preferences.amenities, amenity];
                          setPreferences({ ...preferences, amenities: newAmenities });
                        }}
                      >
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Notification Preferences</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email notifications</span>
                      <Switch
                        checked={preferences.notifications.email}
                        onCheckedChange={(checked) => 
                          setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, email: checked }
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New listing alerts</span>
                      <Switch
                        checked={preferences.notifications.newListings}
                        onCheckedChange={(checked) => 
                          setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, newListings: checked }
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Price drop alerts</span>
                      <Switch
                        checked={preferences.notifications.priceAlerts}
                        onCheckedChange={(checked) => 
                          setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, priceAlerts: checked }
                          })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex space-x-2">
                    <Button onClick={handleSavePreferences} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application History</CardTitle>
              </CardHeader>
              <CardContent>
                {user.applicationHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No applications yet</p>
                ) : (
                  <div className="space-y-4">
                    {user.applicationHistory.map((app) => (
                      <div key={app.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{app.accommodationName}</h4>
                          <Badge className={getStatusColor(app.status)}>
                            {app.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Submitted: {app.submittedAt.toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {app.documents.map((doc) => (
                            <Badge key={doc} variant="outline" className="text-xs">
                              {doc.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="searches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Saved Searches</span>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Search
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.savedSearches.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No saved searches yet</p>
                ) : (
                  <div className="space-y-4">
                    {user.savedSearches.map((search) => (
                      <div key={search.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{search.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant={search.alertsEnabled ? "default" : "outline"}>
                              <Bell className="w-3 h-3 mr-1" />
                              {search.alertsEnabled ? 'Alerts On' : 'Alerts Off'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveSavedSearch(search.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Location: {search.criteria.location}</p>
                          <p>Budget: £{search.criteria.minPrice} - £{search.criteria.maxPrice}/week</p>
                          <p>University: {search.criteria.university}</p>
                          <p>Created: {search.createdAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
