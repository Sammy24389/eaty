import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceWorkerRegistration from "@/components/layout/ServiceWorkerRegistration";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import PwaInstallPrompt from "@/components/layout/PwaInstallPrompt";

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ServiceWorkerRegistration />
      <WhatsAppButton />
      <PwaInstallPrompt />
    </div>
  );
}
