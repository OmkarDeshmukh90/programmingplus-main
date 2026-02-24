import React from "react";

const Footer = () => {
  return (
    <footer className=" text-gray-400 py-4 mt-10 text-center border-t border-gray-700">
      <p>
        &copy; {new Date().getFullYear()} CodePlatform. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
