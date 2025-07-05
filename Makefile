tail-logs:
	ssh root@unnatural-intelligence.com -t 'journalctl -u unnatural-intelligence.service' -f

restart:
	ssh root@unnatural-intelligence.com -t 'systemctl restart unnatural-intelligence.service'

sync-files:
	ls | grep -v -E '.git|node_modules|sync-files' | xargs ./sync-files .env

sync-files-from-scratch:
	ssh root@unnatural-intelligence.com -t 'rm -rf app/unNatural_Intelligence; mkdir app/unNatural_Intelligence'
	ls | grep -v -E '.git|node_modules|sync-files' | xargs ./sync-files .env

sync-and-restart: sync-files restart

sync-from-scratch-and-restart: sync-files-from-scratch restart

.PHONY: tail-logs restart sync-files sync-files-from-scratch sync-and-restart sync-from-scratch-and-restart
