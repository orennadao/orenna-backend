'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Mail, 
  Calendar,
  Edit3,
  Save,
  X,
  Upload,
  ExternalLink,
  Globe,
  Twitter,
  Github
} from 'lucide-react';

interface ProfileIdentityProps {
  user: any;
}

export function ProfileIdentity({ user }: ProfileIdentityProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: 'Alice Chen',
    bio: 'Environmental scientist passionate about climate solutions and regenerative agriculture. Working to bridge the gap between traditional ecological knowledge and modern conservation technology.',
    location: 'San Francisco, CA',
    website: 'https://alicechen.dev',
    twitter: '@alicechen_env',
    email: 'alice@example.com',
    interests: ['Carbon Credits', 'Regenerative Agriculture', 'Biodiversity', 'Water Conservation'],
    expertise: ['Environmental Science', 'Data Analysis', 'Project Management'],
    organization: 'Terra Climate Solutions'
  });

  const handleSave = () => {
    // TODO: Save to API
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data
    setIsEditing(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addInterest = (interest: string) => {
    if (interest && !formData.interests.includes(interest)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const addExpertise = (expertise: string) => {
    if (expertise && !formData.expertise.includes(expertise)) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, expertise]
      }));
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== expertise)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Profile Information
            </CardTitle>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              {isEditing && (
                <Button 
                  size="sm" 
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <Upload className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input 
                  value={formData.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  placeholder="Display Name"
                  className="text-xl font-semibold"
                />
              ) : (
                <h2 className="text-xl font-semibold text-gray-900">{formData.displayName}</h2>
              )}
              <p className="text-sm text-gray-500 mt-1">Member since March 2024</p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            {isEditing ? (
              <Textarea 
                value={formData.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            ) : (
              <p className="text-gray-700">{formData.bio}</p>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              {isEditing ? (
                <Input 
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="City, State/Country"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {formData.location}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
              {isEditing ? (
                <Input 
                  value={formData.organization}
                  onChange={(e) => updateField('organization', e.target.value)}
                  placeholder="Company or Organization"
                />
              ) : (
                <p className="text-gray-700">{formData.organization}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              {isEditing ? (
                <Input 
                  value={formData.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://example.com"
                />
              ) : (
                <a 
                  href={formData.website}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Globe className="w-4 h-4" />
                  {formData.website}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
              {isEditing ? (
                <Input 
                  value={formData.twitter}
                  onChange={(e) => updateField('twitter', e.target.value)}
                  placeholder="@username"
                />
              ) : (
                <a 
                  href={`https://twitter.com/${formData.twitter.replace('@', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Twitter className="w-4 h-4" />
                  {formData.twitter}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interests & Expertise */}
      <Card>
        <CardHeader>
          <CardTitle>Interests & Expertise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Interests</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.interests.map((interest) => (
                <Badge 
                  key={interest} 
                  variant="outline" 
                  className="text-green-700 border-green-300 bg-green-50"
                >
                  {interest}
                  {isEditing && (
                    <button 
                      onClick={() => removeInterest(interest)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Input 
                  placeholder="Add interest..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addInterest(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button 
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addInterest(input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Expertise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Areas of Expertise</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.expertise.map((expertise) => (
                <Badge 
                  key={expertise} 
                  variant="outline" 
                  className="text-blue-700 border-blue-300 bg-blue-50"
                >
                  {expertise}
                  {isEditing && (
                    <button 
                      onClick={() => removeExpertise(expertise)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <Input 
                  placeholder="Add expertise..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addExpertise(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button 
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    addExpertise(input.value);
                    input.value = '';
                  }}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Public Profile</h4>
                <p className="text-sm text-gray-600">Make your profile visible to other users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Show Activity</h4>
                <p className="text-sm text-gray-600">Display your participation history</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Contact Information</h4>
                <p className="text-sm text-gray-600">Allow others to see your contact details</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}