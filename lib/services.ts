export const WHATSAPP_NUMBER = "2348152058238";
export function servicesWhatsAppUrl(service?: string) {
  const message = service
    ? `Hi Tickety! I'd like to know more about ${service.toLowerCase()} for my event.`
    : "Hi Tickety! I'm planning an event and would love to discuss your services.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
export const SERVICES = [
  { id: "ticketing", number: "01", title: "Event ticketing", headline: "Your tickets.\nTheir next great moment.", description: "Create, sell and manage event tickets seamlessly. Give attendees a simple booking experience while you track sales and attendance in one place.", features: ["Ticket creation & sales", "Simple attendee booking", "Sales & attendance tracking"], note: "From the first booking to the final ticket.", icon: "ticket" },
  { id: "check-in", number: "02", title: "Event registration & check-in", headline: "Less waiting.\nMore being there.", description: "Say goodbye to long queues and manual name searches. We provide organised attendee registration, QR ticketing and smooth event-day check-in.", features: ["Attendee registration", "QR ticketing", "Event-day check-in"], note: "A warm welcome starts at the door.", icon: "scan" },
  { id: "promotion", number: "03", title: "Event promotion", headline: "The right event.\nThe right people.", description: "Get your event in front of the right audience. We help organisers promote events through strategic digital marketing, content and partnerships.", features: ["Digital marketing", "Promotional content", "Strategic partnerships"], note: "Give your next event a bigger conversation.", icon: "megaphone" },
  { id: "content", number: "04", title: "Content creation", headline: "Let the moment\nlive a little longer.", description: "Turn your event into content people want to remember. From event coverage to social media content, we help capture and extend the experience beyond the event day.", features: ["Event coverage", "Social media content", "Experience storytelling"], note: "The event ends. The story keeps going.", icon: "camera" },
  { id: "support", number: "05", title: "Event support", headline: "Your vision.\nA team in your corner.", description: "More than a ticketing platform, we support organisers throughout the event journey. From setup and attendee management to event-day coordination, we’re here to make things easier.", features: ["Event setup", "Attendee management", "Event-day coordination"], note: "A little less on your plate. A lot more possibility.", icon: "support" },
] as const;
