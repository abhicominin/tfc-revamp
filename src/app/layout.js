import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

import Menu from "./_interface/menu";
import DynamicScene from "./_helpers/scenewrapper";

export const metadata = {
  title: "TheFaceCraft",
  description: "Created by some of the great minds of the FaceCraft team",
};

const montserratMedium = localFont({
    src: '../../public/Fonts/Montserrat-Medium.ttf',
    variable: '--font-montserrat-medium',
});

const futuraLight = localFont({
    src: '../../public/Fonts/FuturaCyrillicLight.ttf',
    variable: '--font-futura-light',
});

const futuraMedium = localFont({
    src: '../../public/Fonts/FuturaCyrillicMedium.ttf',
    variable: '--font-futura-medium',
});

const futuraDemi = localFont({
    src: '../../public/Fonts/FuturaCyrillicDemi.ttf',
    variable: '--font-futura-demi',
});

const futuraHeavy = localFont({
    src: '../../public/Fonts/FuturaCyrillicHeavy.ttf',
    variable: '--font-futura-heavy',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${montserratMedium.variable} ${futuraLight.variable} ${futuraMedium.variable} ${futuraDemi.variable} ${futuraHeavy.variable} antialiased`}
      >
        <Menu />
        <DynamicScene />
        {children}
        <Script id="chat-widget-config" strategy="beforeInteractive">
          {`window.chatWidgetConfig = {
            companyId: 1,
            apiBaseUrl: 'https://chatbotapi.tfcmockup.com',
            position: 'bottom-right',
            primaryColor: '#7d6fc4',
            title: 'Vera - AI Assistant',
            welcomeMessage: '👋 I am Vera, your AI assistant. I am here to assist you. How can I help you today? 😊?'
          };`}
        </Script>
        <Script src="https://chatbotapi.tfcmockup.com/public/widget/chat-widget.js?v=3.8" strategy="afterInteractive" />
      </body>
    </html>
  );
}