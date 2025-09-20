import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Settings,
  Code,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Star,
  CheckCircle
} from 'lucide-react';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const features = [
    {
      icon: MessageSquare,
      title: 'AI Chat Playground',
      description: 'Chat with multiple AI models simultaneously. Compare responses and find the best answers for your queries.',
      href: '/chat',
      color: 'from-blue-500 to-cyan-500',
      gradient: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200',
      delay: '0ms'
    },
    {
      icon: Settings,
      title: 'AI Providers',
      description: 'Manage your AI providers, API keys, and model configurations in one centralized dashboard.',
      href: '/providers',
      color: 'from-green-500 to-emerald-500',
      gradient: 'bg-gradient-to-br from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      delay: '100ms'
    },
    {
      icon: Code,
      title: 'AI Website Builder',
      description: 'Build full-stack websites with AI assistance. Generate code, deploy instantly, and scale effortlessly.',
      href: '/builder',
      color: 'from-purple-500 to-pink-500',
      gradient: 'bg-gradient-to-br from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      delay: '200ms'
    }
  ];

  const stats = [
    { label: 'AI Models', value: '50+', icon: Sparkles },
    { label: 'Active Users', value: '10K+', icon: Users },
    { label: 'Success Rate', value: '99.9%', icon: TrendingUp },
    { label: 'Uptime', value: '99.99%', icon: Shield }
  ];

  const benefits = [
    'Multi-model AI conversations',
    'Real-time collaboration',
    'Advanced analytics dashboard',
    'Enterprise-grade security',
    '24/7 customer support',
    'API access & integrations'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40"></div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Advanced AI
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 animate-fade-in">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {session.user.name?.split(' ')[0] || 'User'}
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-slate-600 mb-8 animate-fade-in" style={{animationDelay: '200ms'}}>
              Experience the future of AI-powered development with Shin AI Platform
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{animationDelay: '400ms'}}>
              <Button size="lg" className="hover-lift" asChild>
                <Link href="/chat">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start AI Chat
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="hover-lift" asChild>
                <Link href="/analytics">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Powerful AI Features
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Discover the comprehensive suite of AI tools designed to enhance your productivity and creativity
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className={`group hover-lift cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 animate-fade-in ${feature.gradient} ${feature.borderColor}`}
                style={{animationDelay: feature.delay}}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-slate-600 mb-6 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  <Button className="w-full group-hover:bg-opacity-90 transition-colors" asChild>
                    <Link href={feature.href}>
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Why Choose Shin AI?
              </h2>
              <p className="text-slate-300 text-lg mb-8">
                Join thousands of developers and businesses who trust Shin AI for their AI-powered solutions.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={benefit} className="flex items-center space-x-3 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-8 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-4">99.9%</div>
                  <div className="text-slate-300 mb-6">Customer Satisfaction</div>
                  <div className="flex justify-center space-x-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-400 text-sm">
                    "Shin AI has revolutionized how we approach AI development. The platform is intuitive, powerful, and reliable."
                  </p>
                  <div className="mt-4 text-slate-500 text-xs">
                    - Sarah Chen, CTO at TechCorp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Transform Your AI Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the AI revolution today and unlock the full potential of artificial intelligence for your projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="hover-lift" asChild>
              <Link href="/chat">
                <Zap className="w-5 h-5 mr-2" />
                Start Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 hover-lift" asChild>
              <Link href="/contact">
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
