
import React, { useState } from 'react';
import { Users, MessageSquare, Plus, TrendingUp, Star, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const CommunityForum = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: 'Best areas for students in Manchester?',
      content: 'Looking for recommendations on student-friendly neighborhoods in Manchester. Budget around £150/week.',
      author: 'Sarah_M',
      category: 'Recommendations',
      replies: 12,
      likes: 8,
      date: '2024-06-18',
      trending: true,
      aiModerated: true
    },
    {
      id: 2,
      title: 'Landlord not responding to repair requests',
      content: 'My heating has been broken for a week and my landlord isn\'t responding to calls or texts. What can I do?',
      author: 'StudentHousing_Q',
      category: 'Legal Advice',
      replies: 7,
      likes: 15,
      date: '2024-06-17',
      trending: false,
      aiModerated: true
    },
    {
      id: 3,
      title: 'Tips for international students applying for accommodation',
      content: 'Just got accepted to Edinburgh Uni! Any tips for finding good student accommodation as an international student?',
      author: 'InternationalStudent2024',
      category: 'International Students',
      replies: 23,
      likes: 31,
      date: '2024-06-16',
      trending: true,
      aiModerated: true
    },
    {
      id: 4,
      title: 'Deposit dispute - need advice',
      content: 'Landlord is trying to keep £400 of my deposit for "excessive cleaning". The place was clean when I left. Help!',
      author: 'DepositDispute_Help',
      category: 'Legal Advice',
      replies: 19,
      likes: 22,
      date: '2024-06-15',
      trending: false,
      aiModerated: true
    }
  ]);

  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: ''
  });

  const categories = [
    'Recommendations',
    'Legal Advice',
    'International Students',
    'Maintenance Issues',
    'Flatmate Finder',
    'Moving Tips',
    'General Discussion'
  ];

  const trendingTopics = [
    { topic: 'Manchester student areas', posts: 15 },
    { topic: 'Deposit protection', posts: 12 },
    { topic: 'Guarantor services', posts: 8 },
    { topic: 'Utility bills', posts: 6 }
  ];

  const handleSubmitPost = () => {
    if (!newPost.title || !newPost.content || !newPost.category) {
      alert('Please fill in all fields');
      return;
    }

    // AI Moderation simulation
    const containsInappropriate = checkForInappropriateContent(newPost.content);
    
    if (containsInappropriate) {
      alert('Your post contains inappropriate content and cannot be published. Please review and try again.');
      return;
    }

    const post = {
      id: posts.length + 1,
      ...newPost,
      author: 'You',
      replies: 0,
      likes: 0,
      date: new Date().toISOString().split('T')[0],
      trending: false,
      aiModerated: true
    };

    setPosts([post, ...posts]);
    setNewPost({ title: '', content: '', category: '' });
    setShowNewPost(false);
  };

  // Simple AI moderation - checks for inappropriate keywords
  const checkForInappropriateContent = (content: string) => {
    const inappropriateWords = ['spam', 'scam', 'fake', 'illegal'];
    return inappropriateWords.some(word => 
      content.toLowerCase().includes(word.toLowerCase())
    );
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Recommendations': 'bg-blue-100 text-blue-800',
      'Legal Advice': 'bg-red-100 text-red-800',
      'International Students': 'bg-purple-100 text-purple-800',
      'Maintenance Issues': 'bg-orange-100 text-orange-800',
      'Flatmate Finder': 'bg-green-100 text-green-800',
      'Moving Tips': 'bg-yellow-100 text-yellow-800',
      'General Discussion': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Community Forum</h1>
        <p className="text-gray-600 mb-4">Connect with fellow students, share experiences, and get advice with AI moderation</p>
        
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">2,847</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold">{posts.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Trending</p>
                  <p className="text-2xl font-bold">{posts.filter(p => p.trending).length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Moderated</p>
                  <p className="text-2xl font-bold">100%</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New Post Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Community Posts</h2>
        <Button onClick={() => setShowNewPost(!showNewPost)}>
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Post Title</label>
              <Input
                placeholder="What's your question or topic?"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={newPost.category}
                onChange={(e) => setNewPost({...newPost, category: e.target.value})}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <Textarea
                placeholder="Share your experience, ask for advice, or start a discussion..."
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                rows={6}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">AI Moderation Notice</span>
              </div>
              <p className="text-xs text-blue-700">
                All posts are automatically screened by our AI moderation system to ensure community guidelines are followed. 
                Please keep discussions respectful and helpful.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleSubmitPost}>Post to Community</Button>
              <Button variant="outline" onClick={() => setShowNewPost(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Posts Feed */}
        <div className="lg:col-span-2 space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      {post.trending && (
                        <Badge className="bg-orange-100 text-orange-800">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                      {post.aiModerated && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          ✓ AI Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mb-3">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>by {post.author}</span>
                      <span>•</span>
                      <span>{post.date}</span>
                      <span>•</span>
                      <Badge className={getCategoryColor(post.category)}>
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.replies} replies</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600">
                      <Star className="w-4 h-4" />
                      <span>{post.likes} helpful</span>
                    </button>
                  </div>
                  <Button variant="outline" size="sm">Reply</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Trending Topics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{topic.topic}</span>
                    <Badge variant="secondary">{topic.posts}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm">{category}</span>
                    <span className="text-xs text-gray-500">
                      {posts.filter(p => p.category === category).length}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Moderation Info */}
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-800">AI Community Guardian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-purple-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Real-time content moderation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Spam & inappropriate content filtering</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Helpful content promotion</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Community guideline enforcement</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Community Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs text-gray-600">
                <p>• Be respectful and helpful to fellow students</p>
                <p>• Share accurate information and experiences</p>
                <p>• No spam, promotional content, or scams</p>
                <p>• Protect personal privacy and safety</p>
                <p>• Report inappropriate content</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityForum;
