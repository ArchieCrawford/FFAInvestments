import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, Edit2, BookOpen } from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminEducation() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    description: "",
    content_markdown: "",
    video_url: "",
    track: "beginner",
    order_index: 0,
    duration_minutes: 10,
    is_published: false,
  });

  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_lessons')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (lessonData) => {
      const { data, error } = await supabase
        .from('education_lessons')
        .insert(lessonData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setIsDialogOpen(false);
      setEditingLesson(null);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, lessonData }) => {
      const { data, error } = await supabase
        .from('education_lessons')
        .update(lessonData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      setIsDialogOpen(false);
      setEditingLesson(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      description: "",
      content_markdown: "",
      video_url: "",
      track: "beginner",
      order_index: 0,
      duration_minutes: 10,
      is_published: false,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, lessonData: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      slug: lesson.slug || "",
      title: lesson.title || "",
      description: lesson.description || "",
      content_markdown: lesson.content_markdown || "",
      video_url: lesson.video_url || "",
      track: lesson.track || "beginner",
      order_index: lesson.order_index || 0,
      duration_minutes: lesson.duration_minutes || 10,
      is_published: lesson.is_published || false,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-default mb-2">Education Management</h1>
            <p className="text-muted">Create and manage lessons for members</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-blue-800 gap-2"
                onClick={() => {
                  setEditingLesson(null);
                  resetForm();
                }}
              >
                <Plus className="w-4 h-4" />
                Create Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Title *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Introduction to Investment Clubs"
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Slug * (URL-friendly identifier)</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      placeholder="intro-to-investment-clubs"
                      required
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Brief description of the lesson"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Track</Label>
                    <Select
                      value={formData.track}
                      onValueChange={(value) => setFormData({...formData, track: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Order Index</Label>
                    <Input
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({...formData, duration_minutes: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Video URL (optional)</Label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Content (Markdown)</Label>
                    <Textarea
                      value={formData.content_markdown}
                      onChange={(e) => setFormData({...formData, content_markdown: e.target.value})}
                      placeholder="# Lesson Content&#10;&#10;Write your lesson content here in markdown format..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_published"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="is_published" className="cursor-pointer">
                        Publish lesson (make visible to members)
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-blue-800">
                    {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Access to Educational Resources */}
        <Card className="border-none shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Educational Resources & Tools
            </CardTitle>
            <p className="text-muted text-sm">Quick access to interactive learning materials</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">🧮</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-default">Unit Calculator</h3>
                    <p className="text-xs text-muted">Quick unit pricing tool</p>
                  </div>
                </div>
                <p className="text-sm text-muted mb-3">
                  Simple calculator for understanding unit values and member contributions.
                </p>
                <a
                  href="/education/unit-value-system"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Open Calculator →
                </a>
              </div>

              <div className="bg-white rounded-lg border border-green-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">📚</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-default">Complete Unit Guide</h3>
                    <p className="text-xs text-muted">Interactive learning guide</p>
                  </div>
                </div>
                <p className="text-sm text-muted mb-3">
                  Comprehensive interactive guide with real FFA data and live simulations.
                </p>
                <a
                  href="/education/unit-value-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Open Guide →
                </a>
              </div>

              <div className="bg-white rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">📖</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-default">Education Catalog</h3>
                    <p className="text-xs text-muted">Member learning center</p>
                  </div>
                </div>
                <p className="text-sm text-muted mb-3">
                  View the education catalog as members see it with all available resources.
                </p>
                <a
                  href="/education/catalog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  View Catalog →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>All Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Track</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : lessons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted">
                        No lessons created yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    lessons.map(lesson => (
                      <TableRow key={lesson.id} className="hover:bg-bg">
                        <TableCell className="font-semibold text-default">
                          {lesson.order_index}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold">{lesson.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {lesson.track}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted">
                          {lesson.duration_minutes} min
                        </TableCell>
                        <TableCell>
                          <Badge variant={lesson.is_published ? "default" : "secondary"}>
                            {lesson.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(lesson)}
                            className="gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}