import re

with open('src/components/views/StudioView.tsx', 'r') as f:
    text = f.read()

text = text.replace("import React, { useState } from 'react';", "import React, { useState, useEffect } from 'react';")

with open('src/components/views/StudioView.tsx', 'w') as f:
    f.write(text)
