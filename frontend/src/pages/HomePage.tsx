import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, MessageSquare, Video, BarChart4 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="page-transition">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary py-24 text-white">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750')] bg-cover bg-center opacity-10"></div>
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Ace Your Next Interview with AI
            </h1>
            <p className="mb-8 text-lg sm:text-xl">
              Practice makes perfect. Our AI-powered mock interviews help you prepare 
              for your dream job with realistic questions and personalized feedback.
            </p>
            <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              {user ? (
                <Link to="/setup" className="btn inline-flex items-center space-x-2 bg-white px-6 py-3 text-primary">
                  <span>Start Your Interview</span>
                  <ArrowRight size={18} />
                </Link>
              ) : (
                <Link to="/signup" className="btn inline-flex items-center space-x-2 bg-white px-6 py-3 text-primary">
                  <span>Get Started Free</span>
                  <ArrowRight size={18} />
                </Link>
              )}
              <Link to="/login" className="btn inline-flex items-center space-x-2 border border-white bg-transparent px-6 py-3 text-white">
                {user ? "My Dashboard" : "Login"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Our platform uses advanced AI to simulate real interview experiences
              tailored to your career goals and experience level.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="card flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <CheckCircle size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Choose Your Path</h3>
              <p className="text-muted-foreground">
                Select your desired job role and experience level to get relevant questions.
              </p>
            </div>

            <div className="card flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-secondary/10 p-4 text-secondary">
                <MessageSquare size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI-Powered Questions</h3>
              <p className="text-muted-foreground">
                Our AI asks industry-specific questions that match real interviews.
              </p>
            </div>

            <div className="card flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-accent/10 p-4 text-accent">
                <Video size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Video & Audio Analysis</h3>
              <p className="text-muted-foreground">
                We analyze your responses, body language, and presentation skills.
              </p>
            </div>

            <div className="card flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-success/10 p-4 text-success">
                <BarChart4 size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Detailed Feedback</h3>
              <p className="text-muted-foreground">
                Get personalized feedback and tips to improve your interview performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">Success Stories</h2>
            <p className="text-lg text-muted-foreground">
              See how EchoPrep has helped candidates land their dream jobs.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="card">
              <div className="mb-4 text-accent">
                {"★".repeat(5)}
              </div>
              <p className="mb-4 italic text-muted-foreground">
                "After practicing with EchoPrep for two weeks, I felt so much more confident in my real interview. I got the job at a top tech company!"
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <div className="ml-3">
                  <p className="font-medium">Sarah L.</p>
                  <p className="text-sm text-muted-foreground">Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="mb-4 text-accent">
                {"★".repeat(5)}
              </div>
              <p className="mb-4 italic text-muted-foreground">
                "The personalized feedback helped me identify my weak points and improve them before my interview. The questions were spot-on!"
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <div className="ml-3">
                  <p className="font-medium">Michael T.</p>
                  <p className="text-sm text-muted-foreground">Data Scientist</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="mb-4 text-accent">
                {"★".repeat(5)}
              </div>
              <p className="mb-4 italic text-muted-foreground">
                "As a career changer, I was nervous about technical interviews. EchoPrep helped me practice until I felt ready and I landed my first role!"
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                <div className="ml-3">
                  <p className="font-medium">Jamie K.</p>
                  <p className="text-sm text-muted-foreground">UX Designer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Ace Your Interview?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg">
            Start practicing today with our AI-powered mock interviews and get the confidence 
            you need to land your dream job.
          </p>
          {user ? (
            <Link to="/setup" className="btn inline-flex items-center space-x-2 bg-white px-8 py-3 text-primary">
              <span>Start Your Interview Now</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/signup" className="btn inline-flex items-center space-x-2 bg-white px-8 py-3 text-primary">
              <span>Get Started for Free</span>
              <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;