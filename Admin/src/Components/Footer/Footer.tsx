import { Link, useLocation } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Linkedin,
  Instagram,
} from "lucide-react";
import { OfficeTime } from "./OfficeTime";
 

import "./Footer.css";  

const quickLinks = [
  { name: "About Us", href: "/about" },
  { name: "Portfolio", href:"/project"},
  { name: "Gallery", href: "/gallery" },
  { name: "Blog", href: "/blog" },
  { name: "Careers", href: "/careers" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy Policy", href: "/privacy" },
];

const services = [
  { name: "US IT Recruitment", href: "/services/recruitment" },
  { name: "India IT Recruitment", href: "/services/regional" },
  { name: "Healthcare Recruitment", href: "/services/healthcare" },
  { name: "Software Development", href: "/services/software" },
  { name: "Marketing & Branding", href: "/services/marketing" },
];

const highlightedCountries = [
  {
    name: "USA",
    coordinates: [
      [30.73061, -90.935242], // Center point
    ],
    flag: "🇺🇸",
  },
  {
    name: "India",
    coordinates: [
      [25.02579, 55.58727], // Center point
    ],
    flag: "🇮🇳",
  },
];

export const Footer = () => {
  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };
  const location = useLocation();
  const lineColor = "#a3ddff";
  return (
    <footer className="footer">
      {location.pathname !== "/" ? (
        <h3 className="footer-title">
          Our Global Presence
        </h3>
      ) : (
         <></>
      )}
      <div className="footer-map-container">
        <img src="/map.svg" alt="Global Map" className="footer-map-image" />
        <svg
          viewBox="0 0 800 400"
          className="footer-map-svg"
        >
          {highlightedCountries.map((country, i) => (
            <g key={`country-${i}`}>
              {country.coordinates.map((coord, j) => (
                <g key={`country-marker-${j}`}>
                  <path
                    d={`M ${projectPoint(coord[0], coord[1]).x} ${
                      projectPoint(coord[0], coord[1]).y - 10
                    }
                     l -10 -20 a 15 15 0 1 1 20 0 z`}
                    fill={lineColor}
                    opacity="0.4"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.5;0.6;0.5"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </path>
                  <foreignObject
                    x={projectPoint(coord[0], coord[1]).x - 20}
                    y={projectPoint(coord[0], coord[1]).y - 55}
                    width="40"
                    height="25"
                    className="footer-flag-foreignobject"
                  >
                    <div className="footer-flag-container">
                      <img src="/Logo.webp" alt="Logo" className="footer-logo" />
                    </div>
                  </foreignObject>
                </g>
              ))}
            </g>
          ))}
        </svg>
      </div>

      <div className="footer-content">
        <div className="footer-grid">
          {/* Company Info */}
          <div>
            <h3 className="footer-section-title">Ninez Tech LLC</h3>
            <div className="footer-contact-list">
              <p className="footer-contact-item">
                <MapPin size={20} className="footer-icon" />
                <div>
                  🇺🇸 Ninez Tech LLC, 30 N Gould St Ste R Sheridan, WY- 82801, USA.
                </div>
              </p>
              <p className="footer-contact-item">
                <MapPin size={20} className="footer-icon" />
                <div>
                  🇮🇳 407, Elite Business Hub,
                  <div>
                    Opp. Kargil Patrol Punp, SG Highway, Ahemdabad - 380060,
                    Gujarat
                  </div>
                </div>
              </p>
              <p className="footer-contact-item">
                <Phone size={20} className="footer-icon" />
                <a href="callto:+1 3393655999">🇺🇸 +1 339 365 5999</a>
              </p>
              <p className="footer-contact-item">
                <Phone size={20} className="footer-icon" />
                🇮🇳 +91 95101 02450
              </p>
              <p className="footer-contact-item">
                <Mail size={20} className="footer-icon" />
                <a href="mailto:hr@nineztech.com">hr@nineztech.com</a>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="footer-section-title">Quick Links</h3>
            <ul className="footer-links-list">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="footer-link"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="footer-section-title">Services</h3>
            <ul className="footer-links-list">
              {services.map((service) => (
                <li key={service.name}>
                  <Link
                    to={service.href}
                    className="footer-link"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Office Hours */}
          <div>
            <h3 className="footer-section-title">Office Hours</h3>
            <div className="footer-office-hours">
              <OfficeTime
                location="New YorK Office"
                timezone="America/New_York"
              />
              <OfficeTime
                location="India Office"
                timezone="Asia/Kolkata"
              />
            </div>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} Ninez Tech LLC. All rights reserved.
          </p>
          <div className="footer-social-links">
            {[ 
              { icon: Facebook, href: "https://www.facebook.com/nineztech" },
              { icon: Linkedin, href: "https://www.linkedin.com/company/ninez-tech/" },
              { icon: Instagram, href: "https://www.instagram.com/nineztech/" },
            ].map(({ icon: Icon, href }, index) => (
              <a
                key={index}
                href={href}
                className="footer-social-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
