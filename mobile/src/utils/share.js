export const getProfileUrl = ({ userId, username }) => {
  if (username && String(username).trim()) {
    return `https://irtzalink.site/${username}`;
  }
  return `https://irtzalink.site/user/${userId}`;
};

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {}
  try {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return true;
  } catch (e) {
    return false;
  }
};
