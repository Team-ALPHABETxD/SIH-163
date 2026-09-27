const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// 2. Update Feature section to light mode and add feature-card class
content = content.replace(
  `<section id="features" className="py-20 border-b border-slate-800/80 bg-[#080d19]">`,
  `<section id="features" ref={featuresRef} className="py-20 border-b border-slate-200 bg-white">`
);
content = content.replace(
  /<h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">/g,
  `<h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">`
);
content = content.replace(
  /<p className="text-slate-400 mt-3 text-sm/g,
  `<p className="text-slate-600 mt-3 text-sm`
);

// Update feature cards
content = content.replace(
  /className="p-6 bg-\[#0b1222\] border border-slate-800 rounded-md flex flex-col justify-between hover:border-slate-700 transition-colors"/g,
  `className="feature-card p-6 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm"`
);
// Inside feature cards
content = content.replace(
  /<h3 className="text-lg font-semibold text-white mb-2">/g,
  `<h3 className="text-lg font-semibold text-slate-900 mb-2">`
);
content = content.replace(
  /<p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4">/g,
  `<p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">`
);
content = content.replace(
  /border-t border-slate-800\/80 font-mono text-\[11px\] text-slate-500/g,
  `border-t border-slate-200 font-mono text-[11px] text-slate-500`
);

// 3. Update Modules section to light mode
content = content.replace(
  `<section id="modules" className="py-20 border-b border-slate-800\/80 bg-\[#060913\]">`,
  `<section id="modules" className="py-20 border-b border-slate-200 bg-slate-50">`
);
// Module cards
content = content.replace(
  /className="p-5 bg-\[#0b1120\] border border-slate-800 rounded-md hover:border-slate-700 transition-colors flex flex-col justify-between"/g,
  `className="p-5 bg-white border border-slate-200 rounded-md hover:border-slate-300 transition-colors flex flex-col justify-between shadow-sm"`
);
content = content.replace(
  /<h3 className="font-semibold text-base text-white mb-1.5">/g,
  `<h3 className="font-semibold text-base text-slate-900 mb-1.5">`
);
content = content.replace(
  /<p className="text-slate-400 text-xs leading-relaxed">/g,
  `<p className="text-slate-600 text-xs leading-relaxed">`
);
content = content.replace(
  /className="mt-5 pt-3 border-t border-slate-800\/80 flex items-center justify-between text-xs"/g,
  `className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-xs"`
);

// 4. Update Workflow section to light mode
content = content.replace(
  `<section id="workflow" className="py-20 border-b border-slate-800\/80 bg-\[#080d19\]">`,
  `<section id="workflow" className="py-20 border-b border-slate-200 bg-white">`
);
content = content.replace(
  /<p className="text-slate-400 text-sm mt-2">/g,
  `<p className="text-slate-600 text-sm mt-2">`
);
// Workflow cards
content = content.replace(
  /className="p-6 bg-\[#0a0f1d\] border border-slate-800 rounded-md relative"/g,
  `className="p-6 bg-slate-50 border border-slate-200 rounded-md relative shadow-sm"`
);
content = content.replace(
  /<h3 className="text-base font-semibold text-white mb-2">/g,
  `<h3 className="text-base font-semibold text-slate-900 mb-2">`
);

// 5. Update Dashboard Access section to light mode
content = content.replace(
  `<section id="dashboard-access" className="py-20 border-b border-slate-800\/80 bg-\[#060913\]">`,
  `<section id="dashboard-access" className="py-20 border-b border-slate-200 bg-slate-50">`
);
content = content.replace(
  /className="bg-gradient-to-r from-\[#0b1222\] via-\[#0d162d\] to-\[#0b1222\] border border-slate-800 rounded-md p-8 sm:p-12 shadow-2xl"/g,
  `className="bg-white border border-slate-200 rounded-md p-8 sm:p-12 shadow-lg"`
);
content = content.replace(
  /<p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">/g,
  `<p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">`
);
content = content.replace(
  /className="lg:col-span-4 p-5 bg-\[#070b16\] border border-slate-800 rounded-md font-mono text-xs space-y-3"/g,
  `className="lg:col-span-4 p-5 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs space-y-3"`
);
content = content.replace(
  /<span className="text-slate-200">World Monitor<\/span>/g,
  `<span className="text-slate-900">World Monitor</span>`
);
content = content.replace(
  /<span className="text-slate-200">28 Endpoints<\/span>/g,
  `<span className="text-slate-900">28 Endpoints</span>`
);

// 6. Update Footer to light mode
content = content.replace(
  /<footer className="py-12 bg-\[#05070e\] text-slate-500 text-xs">/,
  `<footer className="py-12 bg-white text-slate-500 text-xs border-t border-slate-200">`
);
content = content.replace(
  /border-b border-slate-900/g,
  `border-b border-slate-200`
);
content = content.replace(
  /<div className="font-semibold text-slate-300 font-mono text-xs mb-3">/g,
  `<div className="font-semibold text-slate-900 font-mono text-xs mb-3">`
);
content = content.replace(
  /hover:text-slate-300/g,
  `hover:text-slate-900`
);

fs.writeFileSync('src/pages/Home.tsx', content);
console.log('Update complete');
