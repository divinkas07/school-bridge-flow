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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, FileText, Image } from 'lucide-react';

const postSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  classId: z.string().min(1, 'Please select a class'),
  visibility: z.enum(['class', 'all_users']).default('class'),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, onOpenChange }) => {
  const { profile } = useAuth();
  const [classes, setClasses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [fileUploading, setFileUploading] = React.useState(false);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
      classId: '',
      visibility: 'class' as const,
    },
  });

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB max
      
      if (!isValidType) {
        toast.error(`${file.name}: Type de fichier non supporté. Utilisez des images ou des PDFs.`);
        return false;
      }
      
      if (!isValidSize) {
        toast.error(`${file.name}: Fichier trop volumineux (max 10MB).`);
        return false;
      }
      
      return true;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  React.useEffect(() => {
    const fetchClasses = async () => {
      if (!profile?.user_id) return;
      
      try {
        let classesData = [];

        if (profile.role === 'student') {
          // Pour les étudiants, récupérer les classes où ils sont inscrits
          const { data: enrollments, error } = await supabase
            .from('class_enrollments')
            .select(`
              classes (
                id,
                name,
                code
              )
            `)
            .eq('user_id', profile.user_id);

          if (error) throw error;
          classesData = enrollments?.map(enrollment => enrollment.classes).filter(Boolean) || [];
        } else {
          // Pour les enseignants, récupérer les classes qu'ils enseignent
          const { data, error } = await supabase
            .from('classes')
            .select('id, name, code')
            .eq('teacher_id', profile.user_id);

          if (error) throw error;
          classesData = data || [];
        }

        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };

    if (open) {
      fetchClasses();
    }
  }, [open, profile?.user_id, profile?.role]);

  const onSubmit = async (data: PostFormData) => {
    if (!profile?.user_id) return;

    setLoading(true);
    try {
      let imageUrls: string[] = [];

      // Upload files if any
      if (uploadedFiles.length > 0) {
        setFileUploading(true);
        imageUrls = await Promise.all(
          uploadedFiles.map(file => uploadFile(file))
        );
        setFileUploading(false);
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          content: data.content,
          class_id: data.classId,
          author_id: profile.user_id,
          type: data.visibility,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
        });

      if (error) throw error;

      toast.success('Post created successfully!');
      form.reset();
      setUploadedFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
      setFileUploading(false);
    }
  };

  React.useEffect(() => {
    if (!open) {
      // Reset uploaded files when modal closes
      setUploadedFiles([]);
      form.reset();
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What would you like to share with your students?"
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
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="class">Class only</SelectItem>
                      <SelectItem value="all_users">All users</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Files (Images or PDFs)</FormLabel>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={loading || fileUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={loading || fileUploading}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadedFiles.length > 0 ? `${uploadedFiles.length} fichier(s) sélectionné(s)` : 'Ajouter des fichiers'}
                  </Button>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/20 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <Image className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={loading || fileUploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || fileUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || fileUploading}>
                {loading || fileUploading ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};