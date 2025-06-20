import React, { useState } from 'react';
import { Star, TrendingUp, TrendingDown, MessageSquare, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ReviewAnalysis = () => {
  const [selectedAccommodation, setSelectedAccommodation] = useState('1');

  // Mock review data with AI analysis
  const reviewData = {
    '1': {
      name: "Modern Student Studio - City Centre",
      overallRating: 4.5,
      totalReviews: 127,
      sentiment: {
        positive: 78,
        neutral: 15,
        negative: 7
      },
      trustworthiness: 87,
      keyInsights: [
        { category: 'Location', rating: 4.8, sentiment: 'positive', trend: 'up' },
        { category: 'Cleanliness', rating: 4.2, sentiment: 'positive', trend: 'stable' },
        { category: 'Maintenance', rating: 3.9, sentiment: 'mixed', trend: 'down' },
        { category: 'Value for Money', rating: 4.1, sentiment: 'positive', trend: 'up' },
        { category: 'Management', rating: 4.3, sentiment: 'positive', trend: 'stable' }
      ],
      commonIssues: [
        { issue: 'Slow maintenance response', frequency: 23, severity: 'medium' },
        { issue: 'Noise from nearby construction', frequency: 18, severity: 'low' },
        { issue: 'Wi-Fi connectivity issues', frequency: 12, severity: 'medium' }
      ],
      recentReviews: [
        {
          id: 1,
          rating: 5,
          date: '2024-06-15',
          summary: 'Great location and modern facilities',
          sentiment: 'positive',
          trustScore: 92,
          verified: true
        },
        {
          id: 2,
          rating: 4,
          date: '2024-06-10',
          summary: 'Good value but maintenance could be faster',
          sentiment: 'mixed',
          trustScore: 85,
          verified: true
        },
        {
          id: 3,
          rating: 3,
          date: '2024-06-08',
          summary: 'Decent accommodation, some noise issues',
          sentiment: 'neutral',
          trustScore: 78,
          verified: false
        }
      ]
    }
  };

  const currentData = reviewData[selectedAccommodation as keyof typeof reviewData];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'mixed': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI-Powered Review Analysis</h1>
        <p className="text-gray-600 mb-4">Get trustworthy insights from accommodation reviews using advanced sentiment analysis</p>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Rating</p>
                <p className="text-2xl font-bold">{currentData.overallRating}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500 fill-current" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold">{currentData.totalReviews}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trust Score</p>
                <p className="text-2xl font-bold">{currentData.trustworthiness}%</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Positive Reviews</p>
                <p className="text-2xl font-bold">{currentData.sentiment.positive}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>AI Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-600">Positive ({currentData.sentiment.positive}%)</span>
                <span>{currentData.sentiment.positive} reviews</span>
              </div>
              <Progress value={currentData.sentiment.positive} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Neutral ({currentData.sentiment.neutral}%)</span>
                <span>{currentData.sentiment.neutral} reviews</span>
              </div>
              <Progress value={currentData.sentiment.neutral} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-red-600">Negative ({currentData.sentiment.negative}%)</span>
                <span>{currentData.sentiment.negative} reviews</span>
              </div>
              <Progress value={currentData.sentiment.negative} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Category Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentData.keyInsights.map((insight) => (
              <div key={insight.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{insight.category}</span>
                  <Badge className={getSentimentColor(insight.sentiment)}>
                    {insight.sentiment}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium">{insight.rating}</span>
                  </div>
                  {getTrendIcon(insight.trend)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Common Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Common Issues Identified</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentData.commonIssues.map((issue, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{issue.issue}</span>
                  <p className="text-sm text-gray-600">Mentioned in {issue.frequency} reviews</p>
                </div>
                <Badge 
                  variant={issue.severity === 'high' ? 'destructive' : issue.severity === 'medium' ? 'default' : 'secondary'}
                >
                  {issue.severity} impact
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reviews with Trust Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews with AI Trust Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentData.recentReviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{review.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSentimentColor(review.sentiment)}>
                      {review.sentiment}
                    </Badge>
                    {review.verified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-gray-800 mb-2">{review.summary}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">AI Trust Score: {review.trustScore}%</span>
                  <Progress value={review.trustScore} className="w-24 h-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">AI Summary & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p className="text-blue-700">
              <strong>Overall Assessment:</strong> This accommodation receives consistently positive reviews with high trust scores. 
              The location and modern facilities are frequently praised.
            </p>
            <p className="text-blue-700">
              <strong>Key Strengths:</strong> Excellent location (4.8/5), good value for money, modern amenities
            </p>
            <p className="text-blue-700">
              <strong>Areas for Improvement:</strong> Maintenance response times could be faster (mentioned in 23 reviews)
            </p>
            <p className="text-blue-700">
              <strong>Recommendation:</strong> Highly recommended for students prioritizing location and modern facilities. 
              Consider backup accommodation options if maintenance responsiveness is critical.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewAnalysis;
