import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  isUrgent: z.boolean().default(false),
  visibility: z.enum(['public', 'department', 'class']).default('public'),
  classId: z.string().optional(),
  departmentId: z.string().optional(),
}).refine((data) => {
  if (data.visibility === 'class' && !data.classId) {
    return false;
  }
  if (data.visibility === 'department' && !data.departmentId) {
    return false;
  }
  return true;
}, {
  message: 'Please select the required field based on visibility',
  path: ['classId'],
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

interface CreateAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
  onSuccess?: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ open, onOpenChange, classId, onSuccess }) => {
  const { profile } = useAuth();
  const [classes, setClasses] = React.useState<any[]>([]);
  const [departments, setDepartments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      isUrgent: false,
      visibility: classId ? 'class' as const : 'public' as const,
      classId: classId || '',
      departmentId: '',
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (!profile?.user_id || profile.role !== 'teacher') return;

      try {
        // Fetch classes taught by this teacher
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('id, name, code')
          .eq('teacher_id', profile.id);

        if (classesError) throw classesError;
        setClasses(classesData || []);

        // Fetch all departments for department-wide announcements
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('departments')
          .select('id, name, code')
          .order('name');

        if (departmentsError) throw departmentsError;
        setDepartments(departmentsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (open && profile?.role === 'teacher') {
      fetchData();
    }
  }, [open, profile?.user_id, profile?.role, profile?.id]);

  const onSubmit = async (data: AnnouncementFormData) => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const announcementData: any = {
        title: data.title,
        content: data.content,
        teacher_id: profile.id,
        is_urgent: data.isUrgent,
        visibility: data.visibility,
      };

      // Set class_id and department_id based on visibility
      if (data.visibility === 'class') {
        announcementData.class_id = data.classId || null;
        announcementData.department_id = null;
      } else if (data.visibility === 'department') {
        announcementData.department_id = data.departmentId || null;
        announcementData.class_id = null;
      } else {
        // Public visibility
        announcementData.class_id = null;
        announcementData.department_id = null;
      }

      const { error } = await supabase
        .from('announcements')
        .insert(announcementData);

      if (error) throw error;

      toast.success('Announcement created successfully!');
      form.reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  // Only teachers can create announcements
  if (profile?.role !== 'teacher') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Announcement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter announcement details..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isUrgent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Urgent</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Mark as urgent to highlight this announcement
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public (all users)</SelectItem>
                      <SelectItem value="department">Department only</SelectItem>
                      <SelectItem value="class">Class only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional fields based on visibility */}
            {form.watch('visibility') === 'department' && (
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch('visibility') === 'class' && (
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.code} - {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Announcement'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};