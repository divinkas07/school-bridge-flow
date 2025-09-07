import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Download, 
  Eye,
  Calendar,
  Filter,
  Upload,
  File,
  Image,
  Video,
  Archive
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: {
    name: string;
    avatar?: string;
    role: 'student' | 'teacher';
  };
  className: string;
  uploadedAt: string;
  description?: string;
}

const Documents = () => {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        // TODO: Fetch real data from Supabase
        setDocuments([]);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('pdf')) return <File className="h-5 w-5 text-red-500" />;
    if (lowerType.includes('doc')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (lowerType.includes('ppt')) return <FileText className="h-5 w-5 text-orange-500" />;
    if (lowerType.includes('png') || lowerType.includes('jpg') || lowerType.includes('jpeg')) 
      return <Image className="h-5 w-5 text-green-500" />;
    if (lowerType.includes('mp4') || lowerType.includes('avi')) 
      return <Video className="h-5 w-5 text-purple-500" />;
    if (lowerType.includes('zip') || lowerType.includes('rar')) 
      return <Archive className="h-5 w-5 text-yellow-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filterDocuments = (docs: Document[], filter: string) => {
    switch (filter) {
      case 'recent':
        return docs.filter(doc => {
          const daysSinceUpload = (Date.now() - new Date(doc.uploadedAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpload <= 7;
        });
      case 'my-uploads':
        return docs.filter(doc => doc.uploadedBy.name === profile?.full_name);
      case 'teacher-files':
        return docs.filter(doc => doc.uploadedBy.role === 'teacher');
      default:
        return docs;
    }
  };

  const filteredDocuments = filterDocuments(
    documents.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    activeTab
  );

  const DocumentCard = ({ document }: { document: Document }) => (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getFileIcon(document.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground line-clamp-1 mb-1">
              {document.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {document.className}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(document.size)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {document.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {document.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={document.uploadedBy.avatar} />
              <AvatarFallback className="text-xs bg-muted">
                {document.uploadedBy.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {document.uploadedBy.name}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent-green/10 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Documents</h2>
              <p className="text-sm text-muted-foreground">
                Access shared files and resources
              </p>
            </div>
            {profile?.role === 'teacher' && (
              <Button size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-4 bg-card border-b border-border">
        <div className="max-w-md mx-auto">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="recent" className="text-xs">Recent</TabsTrigger>
              <TabsTrigger value="my-uploads" className="text-xs">Mine</TabsTrigger>
              <TabsTrigger value="teacher-files" className="text-xs">Teacher</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Documents List */}
      <div className="px-4 py-4">
        <div className="max-w-md mx-auto space-y-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground text-sm">
                {searchQuery ? 'No documents match your search' : 'No documents found'}
              </div>
            </div>
          ) : (
            filteredDocuments.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;