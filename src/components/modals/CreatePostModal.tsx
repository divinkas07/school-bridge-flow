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
  visibility: z.enum(['class', 'all_users']).default('all_users'),
  class_id: z.string().optional(),
}).refine((data) => {
  if (data.visibility === 'class') {
    return data.class_id;
  }
  return true;
}, {
  message: 'Class selection is required when visibility is class only',
  path: ['class_id'],
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: string;
  onSuccess?: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, onOpenChange, classId, onSuccess }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const [fileUploading, setFileUploading] = React.useState(false);
  const [classes, setClasses] = React.useState<Array<{id: string, name: string, code: string}>>([]);
  const [loadingClasses, setLoadingClasses] = React.useState(false);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: '',
      visibility: 'all_users' as const,
      class_id: '',
    },
  });

  const watchVisibility = form.watch('visibility');

  // Load classes when modal opens
  React.useEffect(() => {
    const loadClasses = async () => {
      if (open && watchVisibility === 'class') {
        setLoadingClasses(true);
        try {
          const { data, error } = await supabase
            .from('classes')
            .select('id, name, code');
          
          if (error) {
            console.error('Error loading classes:', error);
            toast.error('Failed to load classes');
          } else {
            setClasses(data || []);
          }
        } catch (error) {
          console.error('Error loading classes:', error);
          toast.error('Failed to load classes');
        } finally {
          setLoadingClasses(false);
        }
      }
    };
    
    loadClasses();
  }, [open, watchVisibility]);

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

      const postData: any = {
        content: data.content,
        author_id: profile.user_id,
        type: data.visibility,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      };

      // Add class_id if targeting a specific class
      if (data.visibility === 'class' && data.class_id) {
        postData.class_id = data.class_id;
      }

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;

      toast.success('Post created successfully!');
      form.reset();
      setUploadedFiles([]);
      onOpenChange(false);
      if (onSuccess) onSuccess();
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
      form.reset({
        content: '',
        visibility: 'all_users' as const,
        class_id: '',
      });
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What would you like to share?"
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
            
            {/* Conditional fields for class visibility */}
            {watchVisibility === 'class' && (
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingClasses ? (
                          <div className="p-2 text-sm text-muted-foreground">Loading classes...</div>
                        ) : (
                          classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} ({cls.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
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