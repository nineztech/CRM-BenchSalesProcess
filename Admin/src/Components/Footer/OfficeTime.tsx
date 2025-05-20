import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import { Clock } from "lucide-react";

interface OfficeTimeProps {
  location: string;
  timezone: string;
}

export const OfficeTime: React.FC<OfficeTimeProps> = ({
  location,
  timezone,
}) => {
  const [time, setTime] = useState(moment().tz(timezone));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = moment().tz(timezone);
      setTime(now);

      // Check if office is open (9 AM - 6 PM local time)
      // indian closing till 4 - 10
      const hour = now.hour();
      if (timezone === "Asia/Kolkata") setIsOpen(!(hour >= 4 && hour < 10));
      else setIsOpen(hour >= 9 && hour < 18);
    }, 1000);

    return () => clearInterval(timer);
  }, [timezone]);

  return (
    <div className="flex items-start gap-2">
      <Clock size={20} className="text-primary-orange/80 mt-1" />
      <div>
        <p className="font-medium">{location}</p>
        <p className="text-sm text-gray-400">{time.format("h:mm A")}</p>
        <div
          className={`flex items-center gap-2 text-sm ${
            isOpen ? "text-green-400" : "text-red-400"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current" />
          {isOpen ? "Open Now" : "Closed"}
        </div>
      </div>
    </div>
  );
};
