export const consoleContent = {
  label: "Created By",  
  author: "YingXiaoMo", 
  asciiArt: `
__  __  _               __  __       
\\ \\/ / (_)  __ _   ___ |  \\/  |  ___ 
 \\  /  | | / _\` | / _ \\| |\\/| | / _ \\
 /  \\  | || (_| || (_) | |  | || (_) |
/_/\\_\\ |_| \\__,_| \\___/|_|  |_| \\___/`,

  welcomeMsg: "✨ 欢迎来到我的主页 | 项目已开源",
  repo: "Github: https://github.com/yingxiaomo/home",
  site: "主页: https://ovoxo.cc"
};


export const consoleStyle = {

  left: 'background:#606060;color:#fff;padding:4px 10px;border-radius:4px 0 0 4px;font-weight:600;',
  right: 'background:#e91e63;color:#fff;padding:4px 10px;border-radius:0 4px 4px 0;font-weight:600;',
  ascii: 'font-family:monospace;color:#e91e63;font-weight:bold;',
  welcome: 'color:#888;font-size:12px;margin-top:10px;margin-bottom:5px;',
  link: 'color:#888;font-size:12px;line-height:1.5;'
};

export const initConsole = () => {
  try {
    setTimeout(() => {
      console.log(
        `\n%c ${consoleContent.label} %c ${consoleContent.author} `,
        consoleStyle.left,
        consoleStyle.right
      );

      console.log(
        `%c${consoleContent.asciiArt}`,
        consoleStyle.ascii
      );
      
      console.log(
        `%c${consoleContent.welcomeMsg}`, 
        consoleStyle.welcome
      );
      
      console.log(
        `%c${consoleContent.repo}\n${consoleContent.site}`, 
        consoleStyle.link
      );
    }, 500);
  } catch (e) {
  }
};