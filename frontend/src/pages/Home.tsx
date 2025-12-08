import { useNavigate } from 'react-router-dom';
import { MapPin, Car, CheckCircle, ArrowRight, Train, Users, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: MapPin,
      title: 'Select Your Station',
      description: 'Choose your metro station and destination area',
      color: 'from-primary to-secondary',
    },
    {
      icon: Car,
      title: 'Get Matched',
      description: 'We connect you with drivers heading your way',
      color: 'from-secondary to-[hsl(240,50%,45%)]',
    },
    {
      icon: CheckCircle,
      title: 'Share the Ride',
      description: 'Complete your last-mile journey together',
      color: 'from-accent to-[hsl(82,72%,40%)]',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-full text-primary text-sm">
          <Train className="w-4 h-4" />
          <span>Smart Metro Connectivity</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight font-display">
          Your Last Mile,{' '}
          <span className="text-gradient-urban">Made Simple</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with fellow commuters for shared rides from metro stations to your destination
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto pt-8">
          <Card className="cursor-pointer hover:shadow-urban-lg transition-all duration-300 border-2 border-transparent hover:border-primary group">
            <CardHeader>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-urban group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="font-display">I'm a Rider</CardTitle>
              <CardDescription>
                Find rides from your metro station to your destination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/rider')}
                className="w-full"
                variant="urban-gradient"
              >
                Request a Ride
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-urban-lg transition-all duration-300 border-2 border-transparent hover:border-accent group">
            <CardHeader>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-[hsl(82,72%,40%)] flex items-center justify-center mb-4 shadow-lime-glow group-hover:scale-110 transition-transform duration-300">
                <Car className="h-7 w-7 text-accent-foreground" />
              </div>
              <CardTitle className="font-display">I'm a Driver</CardTitle>
              <CardDescription>
                Offer rides and share your commute with others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/driver')}
                variant="accent"
                className="w-full"
              >
                Register Route
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg">Three simple steps to get started</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center space-y-4 group">
              <div className="relative">
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto shadow-urban-lg group-hover:scale-110 transition-all duration-300`}>
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-primary shadow-urban">
                  {index + 1}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold font-display">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-12">
        <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/10 rounded-3xl p-12">
          <Route className="h-16 w-16 mx-auto mb-6 text-primary opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of commuters making their last mile journey easier and more affordable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => navigate('/rider')} variant="urban-gradient" size="lg">
              Find a Ride
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={() => navigate('/driver')} variant="accent" size="lg">
              Offer a Ride
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
