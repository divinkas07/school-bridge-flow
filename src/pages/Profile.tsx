import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  BookOpen, 
  Users, 
  FileText,
  Settings,
  LogOut,
  Edit3,
  Save,
  X,
  GraduationCap,
  BarChart3,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Profile = () => {
  const { profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    bio: profile?.bio || '',
    student_id: profile?.student_id || '',
  });

  const handleSave = async () => {
    await updateProfile(editForm);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const stats = [
    { label: 'Classes', value: '0', icon: BookOpen },
    { label: 'Assignments', value: '0', icon: FileText },
    { label: 'Messages', value: '0', icon: Users },
  ];

  const recentActivity: any[] = [];

  return (
    <div className="flex-1 bg-background">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="relative inline-block mb-4">
            <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button 
              size="icon" 
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-lg"
              onClick={() => {/* TODO: Handle avatar upload */}}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="text-center text-xl font-semibold"
                />
              </div>
            ) : (
              <h1 className="text-xl font-semibold text-foreground">
                {profile?.full_name}
              </h1>
            )}
            
            <div className="flex items-center justify-center gap-2">
              <Badge variant={profile?.role === 'teacher' ? 'default' : 'secondary'}>
                {profile?.role === 'teacher' ? (
                  <><GraduationCap className="h-3 w-3 mr-1" /> Teacher</>
                ) : (
                  <><BookOpen className="h-3 w-3 mr-1" /> Student</>
                )}
              </Badge>
              {profile?.student_id && (
                <Badge variant="outline" className="text-xs">
                  ID: {profile.student_id}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="text-center">
                  <CardContent className="p-4">
                    <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Profile Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Profile Information</CardTitle>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="min-h-[80px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile?.bio || 'No bio added yet.'}
                  </p>
                )}
              </div>

              {profile?.role === 'student' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Student ID</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.student_id}
                      onChange={(e) => setEditForm(prev => ({ ...prev, student_id: e.target.value }))}
                      placeholder="Enter your student ID"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {profile?.student_id || 'Not provided'}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teacher Dashboard (only for teachers) */}
          {profile?.role === 'teacher' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Teacher Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Class Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Students
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Class Schedule
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-1">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                          <Badge variant="outline" className="text-xs">
                            {activity.class}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings & Actions */}
          <Card>
            <CardContent className="p-0">
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start px-4 py-3">
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Button>
                <Separator />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start px-4 py-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;