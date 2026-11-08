@echo off 
set BASE=https://geo.datav.aliyun.com/areas_v3/bound/ 
set DIR=src\main\resources\static\json 
curl -o %DIR%\110000.json %BASE%110000_full.json 
curl -o %DIR%\120000.json %BASE%120000_full.json 
curl -o %DIR%\130000.json %BASE%130000_full.json 
curl -o %DIR%\140000.json %BASE%140000_full.json 
curl -o %DIR%\150000.json %BASE%150000_full.json 
curl -o %DIR%\210000.json %BASE%210000_full.json 
curl -o %DIR%\220000.json %BASE%220000_full.json 
curl -o %DIR%\230000.json %BASE%230000_full.json 
curl -o %DIR%\310000.json %BASE%310000_full.json 
curl -o %DIR%\320000.json %BASE%320000_full.json 
curl -o %DIR%\330000.json %BASE%330000_full.json 
curl -o %DIR%\340000.json %BASE%340000_full.json 
curl -o %DIR%\350000.json %BASE%350000_full.json 
curl -o %DIR%\360000.json %BASE%360000_full.json 
curl -o %DIR%\370000.json %BASE%370000_full.json 
curl -o %DIR%\410000.json %BASE%410000_full.json 
curl -o %DIR%\420000.json %BASE%420000_full.json 
curl -o %DIR%\430000.json %BASE%430000_full.json 
curl -o %DIR%\440000.json %BASE%440000_full.json 
curl -o %DIR%\450000.json %BASE%450000_full.json 
curl -o %DIR%\460000.json %BASE%460000_full.json 
curl -o %DIR%\500000.json %BASE%500000_full.json 
curl -o %DIR%\510000.json %BASE%510000_full.json 
curl -o %DIR%\520000.json %BASE%520000_full.json 
curl -o %DIR%\530000.json %BASE%530000_full.json 
curl -o %DIR%\540000.json %BASE%540000_full.json 
curl -o %DIR%\610000.json %BASE%610000_full.json 
curl -o %DIR%\620000.json %BASE%620000_full.json 
curl -o %DIR%\630000.json %BASE%630000_full.json 
curl -o %DIR%\640000.json %BASE%640000_full.json 
curl -o %DIR%\650000.json %BASE%650000_full.json 
curl -o %DIR%\710000.json %BASE%710000_full.json 
curl -o %DIR%\810000.json %BASE%810000_full.json 
curl -o %DIR%\820000.json %BASE%820000_full.json 
echo 全部完成! 
pause 
