
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Sparkles, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Advisor() {
  const { data: recommendations, isLoading: analyzing } = useQuery({
    queryKey: ['advisorRecommendations'],
    queryFn: async () => {
      // Simulate slight delay for the AI "thinking" effect
      await new Promise(resolve => setTimeout(resolve, 1500));
      const res = await api.get('/advisor/recommendations');
      return res.data;
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <BrainCircuit className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          AI Sustainability Advisor
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Powered by generative AI, this advisor analyzes thousands of data points across your organization's environmental, social, and governance modules to provide actionable, real-time insights.
        </p>
      </div>

      {analyzing ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Analyzing ESG Data Lakes...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Executive Summary */}
          {recommendations?.executive_summary && (
            <Card className="glass border-t-4 border-t-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Executive ESG Summary</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {recommendations.executive_summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Department Recommendations */}
          {recommendations?.department_recommendations && recommendations.department_recommendations.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Department-Specific Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.department_recommendations.map((dept: any) => (
                  <Card key={dept.id} className="glass">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg">{dept.department}</span>
                        <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded">
                          {dept.issue}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{dept.recommendation}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Global Actionable Recommendations */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" /> Global Action Items
            </h3>
            <div className="space-y-4">
              {recommendations?.global_recommendations?.map((rec: any) => (
                <Card key={rec.id} className="glass hover:shadow-xl transition-all duration-300 border-l-4" style={{ 
                  borderLeftColor: rec.impact === 'Critical' ? '#ef4444' : rec.impact === 'High' ? '#eab308' : '#3b82f6' 
                }}>
                  <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {rec.category}
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 bg-accent rounded-md flex items-center gap-1">
                          {rec.impact === 'Critical' && <AlertCircle className="w-3 h-3 text-red-500" />}
                          {rec.impact === 'High' && <TrendingUp className="w-3 h-3 text-yellow-500" />}
                          {rec.impact} Impact
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rec.confidence}% AI Confidence
                        </span>
                      </div>
                      <h3 className="text-xl font-bold">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Button className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:opacity-90">
                        {rec.action_text} <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
