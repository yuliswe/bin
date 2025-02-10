export PATH="/Users/yu/lab/bin/:$PATH"
built_in_id=$(displayplacer list | grep -iB2 ' *Type *:.*built *in' | grep -i '^Persistent *screen *id' | sed -E 's/^[^:]*: *//g')

# Everything that is not a built-in is an external display
ext_ids=$(displayplacer list | grep -i '^Persistent *screen *id' | grep -v "$built_in_id" | sed -E 's/^[^:]*: *//g')

# Assuming two external displays:
first_ext_id=$(echo "$ext_ids" | sort | head -n1)
second_ext_id=$(echo "$ext_ids" | sort -r | head -n1)

# Get the current display config, swap the external display ids, and rerun it
my_config="$(displayplacer list | grep -E '^ *displayplacer *')"
echo $my_config
toggle_config=$(echo "$my_config" | sed "s/${first_ext_id}/frogdinosaurcat/g")
toggle_config=$(echo "$toggle_config" | sed "s/${second_ext_id}/${first_ext_id}/g")
toggle_config=$(echo "$toggle_config" | sed "s/frogdinosaurcat/${second_ext_id}/g")

echo $toggle_config
eval $toggle_config

