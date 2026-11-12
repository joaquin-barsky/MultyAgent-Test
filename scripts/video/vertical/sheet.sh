# sheet.sh nombre -> hoja con 5 cuadros de la toma
f=tomas/$1.mp4
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
args=(); fil=""
for i in 0 1 2 3 4; do t=$(node -e "console.log($d*$i/4.4)"); args+=(-ss $t -i "$f"); fil+="[$i]scale=270:-1[v$i];"; done
ffmpeg -loglevel error -y "${args[@]}" -filter_complex "${fil}[v0][v1][v2][v3][v4]hstack=5" -frames:v 1 sheets/$1.jpg
