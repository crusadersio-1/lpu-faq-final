import React from 'react';

interface RenderAnswerWithLinksProps {
  text: string;
}

const RenderAnswerWithLinks: React.FC<RenderAnswerWithLinksProps> = ({ text }) => {
  // Regular expression to find URLs (http, https, ftp, www)
  // Added capturing group around the whole pattern for matchAll
  const urlRegex = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])|(\bwww\.[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

  if (!text) {
    return null;
  }

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  // Convert iterator to array to avoid downlevelIteration issue
  const matches = Array.from(text.matchAll(urlRegex));

  for (const match of matches) {
    const url = match[0];
    const index = match.index;

    if (index === undefined) continue;

    // Add the text segment before the URL
    if (index > lastIndex) {
      elements.push(
        <React.Fragment key={`text-${lastIndex}`}>
          {text.substring(lastIndex, index)}
        </React.Fragment>
      );
    }

    // Prepend http:// if www link doesn't have it
    const href = url.startsWith('www.') ? `http://${url}` : url;

    // Add the URL as a link
    elements.push(
      <a 
        key={`link-${index}`} 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline"
      >
        {url}
      </a>
    );

    lastIndex = index + url.length;
  }

  // Add any remaining text after the last URL
  if (lastIndex < text.length) {
    elements.push(
      <React.Fragment key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </React.Fragment>
    );
  }

  // Preserve original whitespace within the text segments (applied via parent or global CSS)
  return <span style={{ whiteSpace: 'pre-wrap' }}>{elements}</span>;
};

export default RenderAnswerWithLinks; 