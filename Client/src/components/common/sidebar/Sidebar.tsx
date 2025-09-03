import React, { useState, useEffect } from 'react';
import { 
  MdHome, 
  MdPersonAdd, 
  MdPeople, 
  MdBusiness, 
  MdMail, 
  MdCardGiftcard, 
  MdKeyboardArrowDown 
} from 'react-icons/md';

interface MenuItem {
  icon: React.ReactNode;
  to: string;
  text: string;
  subItems?: MenuItem[];
}

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isElearningOpen, setIsElearningOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Function to handle mouse enter on sidebar
  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  // Function to handle mouse leave on sidebar
  const handleMouseLeave = () => {
    setIsExpanded(false);
    setIsElearningOpen(false);
  };

  // Listen for path changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Define menu items for student/client placement
  const menuItems: MenuItem[] = [
    {
      icon: <MdHome />,
      to: '/dashboard',
      text: 'Dashboard'
    },
    {
      icon: <MdPersonAdd />,
      to: '/profile',
      text: 'My Profile'
    },
    {
      icon: <MdPeople />,
      to: '/placements',
      text: 'Placements'
    },
    {
      icon: <MdBusiness />,
      to: '#',
      text: 'E-Learning',
      subItems: [
        {
          icon: <MdMail />,
          to: '/courses',
          text: 'My Courses'
        },
        {
          icon: <MdCardGiftcard />,
          to: '/assignments',
          text: 'Assignments'
        },
        {
          icon: <MdPeople />,
          to: '/progress',
          text: 'Progress Track'
        }
      ]
    },
    {
      icon: <MdMail />,
      to: '/resume',
      text: 'Resume Builder'
    },
    {
      icon: <MdPeople />,
      to: '/interviews',
      text: 'Interview Prep'
    },
    {
      icon: <MdCardGiftcard />,
      to: '/resume-checklist',
      text: 'Resume Checklist'
    }
  ];

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.subItems) {
      const isActive = item.subItems.some(subItem => currentPath === subItem.to);
      
      return (
        <React.Fragment key={index}>
          <li>
            <div
              onClick={() => {
                if (item.text === 'E-Learning') {
                  setIsElearningOpen(!isElearningOpen);
                }
              }}
              className={`flex items-center h-12 px-3 text-sm transition-colors relative cursor-pointer ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
              )}
              <span className={`text-2xl ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.icon}
              </span>
              {isExpanded && (
                <div className="ml-3 flex-1 flex items-center justify-between">
                  <span className="font-medium">{item.text}</span>
                  <MdKeyboardArrowDown
                    className={`text-xl transform transition-transform duration-200 ${
                      (item.text === 'E-Learning' && isElearningOpen) ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              )}
            </div>
          </li>
          {((item.text === 'E-Learning' && isElearningOpen)) && 
           isExpanded && item.subItems.map((subItem, subIndex) => {
            const isSubItemActive = currentPath === subItem.to;
            
            return (
              <li key={`${index}-${subIndex}`}>
                <button
                  onClick={() => {
                    setCurrentPath(subItem.to);
                    window.history.pushState(null, '', subItem.to);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className={`flex items-center h-12 pl-12 pr-3 text-sm transition-colors relative w-full text-left ${
                    isSubItemActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {isSubItemActive && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
                  )}
                  <span className={`text-2xl ${isSubItemActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {subItem.icon}
                  </span>
                  <span className="ml-3 whitespace-nowrap font-medium">
                    {subItem.text}
                  </span>
                </button>
              </li>
            );
          })}
        </React.Fragment>
      );
    }

    return (
      <SidebarItem
        key={index}
        icon={item.icon}
        to={item.to}
        text={item.text}
        isExpanded={isExpanded}
        isActive={currentPath === item.to}
        setCurrentPath={setCurrentPath}
      />
    );
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm z-50 flex flex-col transition-all duration-300"
        style={{ width: isExpanded ? 256 : 64 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo Section */}
        <div className="flex items-center h-16 px-3 flex-shrink-0">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          {isExpanded && (
            <span className="ml-3 font-semibold text-[18px] flex items-center relative">
              Student Portal
              {/* <span className="absolute -top-2 left-[95px]">
                <span className="inline-flex items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold px-2.5 py-0.5 shadow-md" style={{ minWidth: 28, maxHeight: 17, minHeight: 15, paddingBottom: 5 }}>
                  pro
                </span>
              </span> */}
            </span>
          )}
        </div>

        {/* Menu List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <ul className="mt-4">
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </ul>
        </div>
      </div>

      {/* Overlay when sidebar is expanded */}
      {isExpanded && (
        <div className="fixed inset-0 bg-gray-900/25 z-40" />
      )}
    </>
  );
};

// Sidebar Item Component
type SidebarItemProps = {
  icon: React.ReactNode;
  to: string;
  text: string;
  isExpanded: boolean;
  isActive: boolean;
  setCurrentPath: React.Dispatch<React.SetStateAction<string>>;
};

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, to, text, isExpanded, isActive, setCurrentPath }) => (
  <li>
    <button
      onClick={() => {
        setCurrentPath(to);
        window.history.pushState(null, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
      className={`flex items-center h-12 px-3 text-sm transition-colors relative w-full text-left ${
        isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
      )}
      <span className={`text-2xl ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{icon}</span>
      {isExpanded && (
        <span className="ml-3 whitespace-nowrap font-medium">
          {text}
        </span>
      )}
    </button>
  </li>
);

export default Sidebar;
