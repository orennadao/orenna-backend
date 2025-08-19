# 0) Backup old configs
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p ~/terminal-backup-$STAMP
for f in ~/.bashrc ~/.bash_profile ~/.zshrc ~/.zprofile ~/.p10k.zsh ~/.oh-my-zsh; do
  [ -e "$f" ] && mv "$f" ~/terminal-backup-$STAMP/
done

# 1) Ensure your login shell is zsh
chsh -s /bin/zsh

# 2) Install Homebrew font (Nerd Font needed for those glyphs)
# (Skip the 'tap' if you've already done it.)
brew tap homebrew/cask-fonts
brew install --cask font-meslo-lg-nerd-font

# 3) Install oh-my-zsh
export RUNZSH=no
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 4) Install Powerlevel10k theme
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/themes/powerlevel10k

# 5) Create fresh zprofile and zshrc
cat > ~/.zprofile <<'EOF'
[ -d /opt/homebrew/bin ] && export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
[ -d /usr/local/bin ] && export PATH="/usr/local/bin:/usr/local/sbin:$PATH"
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
EOF

cat > ~/.zshrc <<'EOF'
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"
plugins=(git)
source $ZSH/oh-my-zsh.sh
[[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh
EOF

# 6) Restart shell, then run the Powerlevel10k config wizard
exec zsh -l
After that, set the font in iTerm2:

iTerm2 → Preferences → Profiles → Text

Font: MesloLGS Nerd Font (Regular; also set Non-ASCII to the same)

iTerm2 → Preferences → Profiles → General → Command: Login shell (not a custom command)

Then run:

bash
Copy
Edit
p10k configure
Accept the glyph tests; if you see broken symbols, the font isn’t set in iTerm yet.