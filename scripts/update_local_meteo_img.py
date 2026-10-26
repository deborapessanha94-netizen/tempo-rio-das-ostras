import shutil
import os

shutil.copyfile('img/inmet_live_00utc.png', 'img/meteograma_inmet.png')
print("Updated img/meteograma_inmet.png with latest official 00 UTC run from INMET!")
