find "$PWD" -name '*.less' | while read line; do
    REPLACE=`echo $line | sed "s|\.less|\.css|"`

    # echo "$line --> $REPLACE"
    (lessc "$line" "$REPLACE" &)
done

