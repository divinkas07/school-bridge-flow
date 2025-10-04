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
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  code: z.string().min(1, 'Class code is required'),
  description: z.string().optional(),
  credits: z.number().min(1, 'Credits must be at least 1').max(20, 'Credits cannot exceed 20'),
  max_students: z.number().min(1, 'Must allow at least 1 student').max(200, 'Cannot exceed 200 students'),
});

type ClassFormData = z.infer<typeof classSchema>;

interface CreateClassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [departments, setDepartments] = React.useState<Array<{id: string, name: string, code: string}>>([]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      credits: 3,
      max_students: 30,
    },
  });

  // Load departments when modal opens
  React.useEffect(() => {
    const loadDepartments = async () => {
      if (open) {
        setLoadingDepartments(true);
        try {
          const { data, error } = await supabase
            .from('departments')
            .select('id, name, code')
            .order('name');
          
          if (error) {
            console.error('Error loading departments:', error);
            toast.error('Failed to load departments');
          } else {
            setDepartments(data || []);
          }
        } catch (error) {
          console.error('Error loading departments:', error);
          toast.error('Failed to load departments');
        } finally {
          setLoadingDepartments(false);
        }
      }
    };
    
    loadDepartments();
  }, [open]);

  const onSubmit = async (data: ClassFormData) => {
    if (!profile?.user_id) return;

    setLoading(true);
    try {
      const classData = {
        name: data.name,
        code: data.code,
        description: data.description || null,
        credits: data.credits,
        max_students: data.max_students,
        teacher_id: profile.user_id,
      };

      const { error } = await supabase
        .from('classes')
        .insert(classData);

      if (error) throw error;

      toast.success('Class created successfully!');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!open) {
      form.reset({
        name: '',
        code: '',
        description: '',
        credits: 3,
        max_students: 30,
      });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Advanced Mathematics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. MATH401" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what this class is about..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="20"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="max_students"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Students</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="200"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || loadingDepartments}>
                {loading ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};