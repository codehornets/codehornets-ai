import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>

          <CardContent className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using this service, you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to these terms, please do not
                use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
              <p className="text-muted-foreground">
                Permission is granted to temporarily access the materials (information or software)
                on this service for personal, non-commercial transitory viewing only. This is the
                grant of a license, not a transfer of title.
              </p>
              <p className="text-muted-foreground mt-2">
                Under this license you may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or public display</li>
                <li>Attempt to reverse engineer any software contained in the service</li>
                <li>Remove any copyright or proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground">
                When you create an account with us, you must provide accurate, complete, and current
                information. Failure to do so constitutes a breach of the Terms. You are responsible
                for safeguarding the password and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Prohibited Activities</h2>
              <p className="text-muted-foreground">
                You agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc list-inside text-muted-foreground ml-4 mt-2 space-y-1">
                <li>Using the service for any illegal purpose or in violation of any laws</li>
                <li>Violating or infringing other users' intellectual property rights</li>
                <li>Transmitting any harmful code, viruses, or malicious software</li>
                <li>Interfering with or disrupting the service or servers</li>
                <li>Attempting to gain unauthorized access to any portion of the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Content Ownership</h2>
              <p className="text-muted-foreground">
                You retain all rights to the content you submit, post, or display on or through the
                service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free
                license to use, modify, publicly perform, publicly display, reproduce, and distribute
                such content on and through the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Privacy</h2>
              <p className="text-muted-foreground">
                Your use of the service is also governed by our Privacy Policy. Please review our{' '}
                <Link to="/Privacy" className="text-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
                , which also governs the service and informs users of our data collection practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Disclaimer</h2>
              <p className="text-muted-foreground">
                The materials on this service are provided on an 'as is' basis. We make no warranties,
                expressed or implied, and hereby disclaim and negate all other warranties including,
                without limitation, implied warranties or conditions of merchantability, fitness for
                a particular purpose, or non-infringement of intellectual property or other violation
                of rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                In no event shall we or our suppliers be liable for any damages (including, without
                limitation, damages for loss of data or profit, or due to business interruption)
                arising out of the use or inability to use the materials on this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Modifications</h2>
              <p className="text-muted-foreground">
                We may revise these terms of service at any time without notice. By using this service
                you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us through our{' '}
                <Link to="/Support" className="text-primary hover:underline font-medium">
                  Support page
                </Link>
                .
              </p>
            </section>

            <div className="pt-6 mt-8 border-t">
              <Link to="/Signup">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign Up
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;
